import type { StoryViewPort } from "../interfaces/index";
import type { QteViewPort } from "../interfaces/index";
import type { TextRendererPort } from "../interfaces/index";
import type { ActiveEffect, QteSequenceResult, StoryScene } from "../types/index";

const CHOICE_COLORS: Readonly<Record<string, string>> = {
    blue: "#72a7ff",
    brown: "#c4946d",
    green: "#70d28b",
    hazel: "#d2b65b",
    grey: "#d3d3d3",
    lightblue: "#87cefa",
    darkblue: "#7995d9",
    lightyellow: "#fff3a6",
    orange: "#ffae63",
    firebrick: "#ff7b70",
    beige: "#f5deb3",
    bronze: "#cd9a56",
    olive: "#bdc66d",
    pink: "#ff9bc2",
    lightbrown: "#d2a679",
    lightpink: "#ffb6c1",
    darkgrey: "#b0b0b0",
};

export class StoryView implements StoryViewPort {
    private readonly root: HTMLElement;
    private readonly textRenderer: TextRendererPort;
    private readonly qteView: QteViewPort;
    private currentTextElement: HTMLElement | null = null;
    private currentSceneController: AbortController | null = null;

    constructor(root: HTMLElement, textRenderer: TextRendererPort, qteView: QteViewPort) {
        this.root = root;
        this.textRenderer = textRenderer;
        this.qteView = qteView;
    }

    public render(
        scene: StoryScene,
        onChoice: (choiceId: string) => void,
        onQteResult: (result: QteSequenceResult) => void,
        activeEffects: Readonly<Record<string, ActiveEffect>>,
    ): void {
        this.currentSceneController?.abort();
        this.currentSceneController = null;
        if (this.currentTextElement) this.textRenderer.skip(this.currentTextElement);

        const content = document.createElement("section");
        content.className = "main";

        const title = document.createElement("h1");
        title.className = "Quest_Title";
        title.textContent = scene.title;

        const text = document.createElement("p");
        text.className = "TextBlock";
        this.currentTextElement = text;
        text.tabIndex = 0;
        text.setAttribute("role", "button");
        text.setAttribute("aria-label", "Skip text animation");
        text.addEventListener("click", () => this.textRenderer.skip(text));
        text.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                this.textRenderer.skip(text);
            }
        });

        const choices = document.createElement("nav");
        choices.className = "story-choices";
        choices.setAttribute("aria-label", "Story choices");

        const choiceButtons: HTMLButtonElement[] = [];
        scene.choices.forEach((choice, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = choice.destination.type === "back"
                ? "story-choice story-choice--back"
                : "story-choice";
            button.dataset.choiceId = choice.id;
            const choiceColor = CHOICE_COLORS[choice.id];
            if (choiceColor) button.style.color = choiceColor;
            button.textContent = `(${index + 1}) ${choice.label}`;
            if (scene.qte) button.disabled = true;
            button.addEventListener("click", () => onChoice(choice.id), { once: true });
            choiceButtons.push(button);
            choices.append(button);
        });

        if (scene.choices.length === 0) {
            const note = document.createElement("p");
            note.textContent = "This is the end of the story content migrated so far.";
            choices.append(note);
        }

        content.append(title, text);
        const activeEffectEntries = Object.entries(activeEffects);
        if (activeEffectEntries.length > 0) {
            const effectList = document.createElement("ul");
            effectList.className = "active-effects";
            effectList.setAttribute("aria-label", "Active buffs and debuffs");
            for (const [id, effect] of activeEffectEntries) {
                const entry = document.createElement("li");
                const modifier = effect.kind === "buff" ? "+" : "-";
                const duration = effect.remainingChoices === null
                    ? "Permanent"
                    : `${effect.remainingChoices} choice${effect.remainingChoices === 1 ? "" : "s"} remaining`;
                entry.textContent = `${id}: ${effect.kind} to ${effect.target} `
                    + `(${modifier}${effect.magnitude}; ${duration})`;
                entry.dataset.effectKind = effect.kind;
                effectList.append(entry);
            }
            content.append(effectList);
        }
        let qteContainer: HTMLElement | null = null;
        if (scene.qte) {
            qteContainer = document.createElement("div");
            qteContainer.className = "qte-container";
            qteContainer.setAttribute("aria-label", "Quick-time event");
            content.append(qteContainer);
        }
        content.append(choices);
        if (scene.contentNotice) {
            const notice = document.createElement("p");
            notice.className = "story-content-note";
            notice.setAttribute("role", "note");
            notice.textContent = scene.contentNotice;
            content.append(notice);
        }
        this.root.replaceChildren(content);
        if (scene.qte && qteContainer) {
            const controller = new AbortController();
            this.currentSceneController = controller;
            void this.qteView.play(qteContainer, scene.qte, controller.signal)
                .then((result) => {
                    if (controller.signal.aborted) return;
                    this.showQteResult(qteContainer, result);
                    choiceButtons.forEach((button) => {
                        button.disabled = false;
                    });
                    onQteResult(result);
                })
                .catch((error: unknown) => {
                    if (controller.signal.aborted) return;
                    this.showError(`Could not run the quick-time event: ${String(error)}`);
                    choiceButtons.forEach((button) => {
                        button.disabled = false;
                    });
                });
        }
        void this.textRenderer.render({
            target: text,
            text: scene.text,
            position: scene.position ?? "Left",
            ...(scene.textOptions ? { options: scene.textOptions } : {}),
        }).catch((error: unknown) => {
            this.showError(`Could not render story text: ${String(error)}`);
        });
    }

    private showQteResult(container: HTMLElement, result: QteSequenceResult): void {
        const summary = document.createElement("p");
        summary.className = `qte-summary qte-summary--${result.result}`;
        summary.setAttribute("role", "status");
        summary.textContent = `QTE ${result.result}: ${result.score} points`
            + ` (${result.perfectCount} perfect, ${result.successCount} success, ${result.failCount} missed).`;
        container.append(summary);
    }

    public showError(message: string): void {
        let errorElement = this.root.querySelector<HTMLParagraphElement>("[data-story-error]");
        if (!errorElement) {
            errorElement = document.createElement("p");
            errorElement.dataset.storyError = "true";
            errorElement.setAttribute("role", "alert");
            this.root.append(errorElement);
        }

        errorElement.textContent = message;
    }
}
