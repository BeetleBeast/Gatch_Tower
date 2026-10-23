import type {
    TextAnimatorPort,
    TextRenderRequest,
    TextRendererPort,
} from "../interfaces/index";
import { DEFAULT_TEXT_RENDER_OPTIONS } from "../constants/index";
import type { TextRenderOptions } from "../types/index";
import { splitTextLines } from "./textRenderer/textFormatting";
import { TextStyler } from "./textRenderer/textStyler";

interface RenderSession {
    elements: HTMLElement[];
    skipped: boolean;
    cancelled: boolean;
}

/**
 * Coordinates rendering narrative and interface text into a supplied DOM element.
 *
 * This replaces the old `typeText()` function's rendering responsibilities. It
 * accepts an element rather than a selector, receives text and position as
 * explicit data, and delegates animation to an injected animator.
 *
 * Supported behavior carried forward from `TextHandler.js`:
 * - Typewriter, fade, and scramble effects
 * - Skip the active animation and reveal the remaining lines immediately
 * - Highlight selected snippets or color the full text
 * - Create separate line elements with an optional CSS class
 * - Set text position using the element's `data-position` attribute
 * - Configure colors and animation timing per render request
 *
 * Render options:
 * - `printImmediately`: bypasses animation and displays the line immediately
 * - `replace`: clears the target before rendering; false appends the new lines
 * - `secondaryElement`: creates one span per input line when true
 * - `secondaryElementTitle`: optional CSS class name(s) for those line spans
 * - `Coloring`: applies a whole-text color or colors the listed snippets
 * - `defaultColor`: base color and the color restored after temporary coloring
 * - `timeSettings`: controls fade delay, scramble cycle speed, and typing delay
 * - `effect`: chooses `typewriter`, `fade`, or `scramble`
 *
 * `TextRenderRequest.position` replaces the old `sceneTexts.Position` field.
 * `TextRenderRequest.target` replaces `MainElementID` and `MainElementBlock`:
 * callers resolve their DOM element before calling the renderer. Text is
 * supplied directly as a string or string array instead of `sceneTexts.Lines`.
 *
 * Save preferences and player-death color are intentionally not read here.
 * Supply those values through render options when the new save/settings model
 * is ready. Text is inserted as text nodes; HTML markup in story text is not
 * interpreted.
 * Per-target render sessions replace the old global typing tokens and prevent
 * overlapping renders from leaving stale text or animation state behind.
 *
 * The old `~` custom break marker is not supported. Use newline characters
 * (`\n`) in the text. Whitespace and newlines remain part of the text content.
 *
 * @see TextAnimatorPort
 * @see TextStyler
 * @see splitTextLines
 *
 * @example
 * await renderer.render({
 *     target: dialogueElement,
 *     text: "The old door opens.\nA cold wind escapes.",
 *     position: "Left",
 *     options: { effect: "typewriter" },
 * });
 *
 * @example
 * await renderer.render({
 *     target: dialogueElement,
 *     text: "The ancient door glows with magical energy.",
 *     position: "Centered",
 *     options: {
 *         effect: "fade",
 *         Coloring: {
 *             OnlySnippet: true,
 *             snippet: ["ancient", "magical"],
 *             Color: ["#8B4513", "#FFD700"],
 *             Background: [],
 *             duration: 2,
 *         },
 *     },
 * });
 *
 */
export class StoryTextRenderer implements TextRendererPort {
    private readonly animator: TextAnimatorPort;
    private readonly defaultOptions: TextRenderOptions;
    private readonly styler: TextStyler;
    private readonly sessions = new WeakMap<HTMLElement, RenderSession>();
    private readonly colorResetTimers = new WeakMap<HTMLElement, number>();
    private readonly originalColors = new WeakMap<HTMLElement, string>();

    /**
     * @param animator Injected effect selector and animation skipper.
     * @param defaultOptions Defaults merged with each request's optional settings.
     * @param styler Text color and snippet-highlighting implementation.
     */
    constructor(
        animator: TextAnimatorPort,
        defaultOptions: TextRenderOptions = DEFAULT_TEXT_RENDER_OPTIONS,
        styler: TextStyler = new TextStyler(),
    ) {
        this.animator = animator;
        this.defaultOptions = defaultOptions;
        this.styler = styler;
    }

    /**
     * Renders one or more lines, awaiting each configured animation in order.
     * A new render on the same target cancels the previous render.
     */
    public async render(request: TextRenderRequest): Promise<void> {
        const options = this.resolveOptions(request);
        this.cancelRender(request.target);
        this.clearColorResetTimer(request.target);

        const session = this.createSession(request.target, request.position, options);
        try {
            await this.renderLines(request, options, session);
        } finally {
            this.finishSession(request.target, session);
        }

        if (!session.cancelled) this.scheduleColorReset(request.target, options);
    }

    /**
     * Immediately completes the active line and reveals all remaining lines.
     * Has no effect when the target is not currently being rendered.
     */
    public skip(target: HTMLElement): void {
        const session = this.sessions.get(target);
        if (!session) return;

        session.skipped = true;
        this.skipActiveLines(session);
    }

    private resolveOptions(request: TextRenderRequest): TextRenderOptions {
        const supplied = request.options ?? {};
        return {
            ...this.defaultOptions,
            ...supplied,
            Coloring: supplied.Coloring ?? this.defaultOptions.Coloring,
            timeSettings: {
                ...this.defaultOptions.timeSettings,
                ...supplied.timeSettings,
            },
        };
    }

    private createSession(
        target: HTMLElement,
        position: TextRenderRequest["position"],
        options: TextRenderOptions,
    ): RenderSession {
        this.prepareTarget(target, position, options);
        const session: RenderSession = { elements: [], skipped: false, cancelled: false };
        this.sessions.set(target, session);
        return session;
    }

    private prepareTarget(
        target: HTMLElement,
        position: TextRenderRequest["position"],
        options: TextRenderOptions,
    ): void {
        if (options.replace) target.replaceChildren();
        if (position === "default") delete target.dataset.position;
        else target.dataset.position = position;
        this.originalColors.set(target, target.style.color);
        target.style.color = options.defaultColor;
    }

    private async renderLines(
        request: TextRenderRequest,
        options: TextRenderOptions,
        session: RenderSession,
    ): Promise<void> {
        const lines = splitTextLines(request.text, options.secondaryElement);
        for (const line of lines) {
            if (session.cancelled) return;

            const element = this.createLineElement(options);
            session.elements.push(element);
            request.target.append(element);

            await this.animator.animate(element, line, {
                effect: options.effect,
                timing: options.timeSettings,
                printImmediately: options.printImmediately || session.skipped,
            });

            if (session.cancelled) return;
            this.styler.apply(element, options.Coloring);

            if (session.skipped) {
                this.appendRemainingLines(request.target, lines, session, options);
                return;
            }
        }
    }

    private createLineElement(options: TextRenderOptions): HTMLSpanElement {
        const element = document.createElement("span");
        element.classList.add("story-text-line");

        if (options.secondaryElement && options.secondaryElementTitle) {
            const classes = options.secondaryElementTitle
                .split(/\s+/u)
                .filter((className) => className.length > 0);
            element.classList.add(...classes);
        }

        return element;
    }

    private appendRemainingLines(
        target: HTMLElement,
        lines: string[],
        session: RenderSession,
        options: TextRenderOptions,
    ): void {
        for (const line of lines.slice(session.elements.length)) {
            const element = this.createLineElement(options);
            element.textContent = line;
            this.styler.apply(element, options.Coloring);
            session.elements.push(element);
            target.append(element);
        }
    }

    private skipActiveLines(session: RenderSession): void {
        for (const element of session.elements) this.animator.skip(element);
    }

    private cancelRender(target: HTMLElement): void {
        const session = this.sessions.get(target);
        if (!session) return;

        session.cancelled = true;
        this.skipActiveLines(session);
    }

    private finishSession(target: HTMLElement, session: RenderSession): void {
        if (this.sessions.get(target) === session) this.sessions.delete(target);
    }

    private clearColorResetTimer(target: HTMLElement): void {
        const timer = this.colorResetTimers.get(target);
        if (timer === undefined) return;

        window.clearTimeout(timer);
        this.colorResetTimers.delete(target);
    }

    private scheduleColorReset(target: HTMLElement, options: TextRenderOptions): void {
        if (options.Coloring.duration <= 0) return;

        const timer = window.setTimeout(() => {
            this.styler.restore(target, this.originalColors.get(target) || options.defaultColor);
            this.colorResetTimers.delete(target);
        }, options.Coloring.duration * 1000);
        this.colorResetTimers.set(target, timer);
    }
}
