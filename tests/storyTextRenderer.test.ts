import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TextAnimatorPort, TextRenderRequest } from "../src/interfaces/index";
import { DEFAULT_TEXT_RENDER_OPTIONS } from "../src/constants/index";
import { StoryTextRenderer } from "../src/ui/textRenderer";

function createAnimator(): TextAnimatorPort {
    return {
        animate: vi.fn(async (target: HTMLElement, text: string) => {
            target.textContent = text;
        }),
        skip: vi.fn((target: HTMLElement) => {
            target.textContent = "finished";
        }),
    };
}

function createRequest(
    target: HTMLElement,
    overrides: Partial<TextRenderRequest> = {},
): TextRenderRequest {
    return {
        target,
        text: "Opening line\nSecond line",
        position: "Centered",
        ...overrides,
    };
}

describe("StoryTextRenderer", () => {
    beforeEach(() => {
        document.body.replaceChildren();
        vi.useRealTimers();
    });

    it("renders newline-separated text as positioned line elements", async () => {
        const target = document.createElement("div");
        const animator = createAnimator();
        const renderer = new StoryTextRenderer(animator);

        await renderer.render(createRequest(target, {
            options: { printImmediately: true },
        }));

        expect(target.dataset.position).toBe("Centered");
        expect(Array.from(target.children, (line) => line.textContent)).toEqual([
            "Opening line",
            "Second line",
        ]);
        expect(animator.animate).toHaveBeenCalledTimes(2);
        expect(animator.animate).toHaveBeenNthCalledWith(
            1,
            target.children[0],
            "Opening line",
            expect.objectContaining({ printImmediately: true }),
        );
    });

    it("treats story markup as text instead of interpreting it as HTML", async () => {
        const target = document.createElement("div");
        const renderer = new StoryTextRenderer(createAnimator());

        await renderer.render(createRequest(target, {
            text: "<img src=x onerror=alert(1)>",
            options: { printImmediately: true },
        }));

        expect(target.querySelector("img")).toBeNull();
        expect(target.textContent).toBe("<img src=x onerror=alert(1)>");
    });

    it("replaces existing content by default and appends when replace is false", async () => {
        const target = document.createElement("div");
        target.textContent = "Existing";
        const renderer = new StoryTextRenderer(createAnimator());

        await renderer.render(createRequest(target, {
            text: "Added",
            options: { printImmediately: true, secondaryElement: false },
        }));
        expect(target.textContent).toBe("Added");

        await renderer.render(createRequest(target, {
            text: " more",
            options: { printImmediately: true, replace: false, secondaryElement: false },
        }));
        expect(target.textContent).toBe("Added more");
    });

    it("applies per-request coloring and restores the original color after its duration", async () => {
        vi.useFakeTimers();
        const target = document.createElement("div");
        target.style.color = "black";
        const renderer = new StoryTextRenderer(createAnimator());

        await renderer.render(createRequest(target, {
            text: "A red word",
            options: {
                printImmediately: true,
                Coloring: {
                    OnlySnippet: true,
                    snippet: ["red"],
                    Color: ["red"],
                    Background: [],
                    duration: 1,
                },
            },
        }));

        const highlighted = target.querySelector<HTMLElement>("[data-text-style]");
        expect(highlighted?.textContent).toBe("red");
        expect(highlighted?.style.color).toBe("red");

        await vi.advanceTimersByTimeAsync(1000);
        expect(target.style.color).toBe("black");
        expect(target.querySelector("[data-text-style]")).toBeNull();
        vi.useRealTimers();
    });

    it("reveals remaining lines when the active line is skipped", async () => {
        let finishCurrent: (() => void) | undefined;
        const animator: TextAnimatorPort = {
            animate: vi.fn((target: HTMLElement, text: string, request) => {
                if (request.printImmediately) {
                    target.textContent = text;
                    return Promise.resolve();
                }

                return new Promise<void>((resolve) => {
                    target.textContent = text.slice(0, 1);
                    finishCurrent = () => {
                        target.textContent = text;
                        resolve();
                    };
                });
            }),
            skip: vi.fn((target: HTMLElement) => {
                target.textContent = "Opening line";
                finishCurrent?.();
            }),
        };
        const target = document.createElement("div");
        const renderer = new StoryTextRenderer(animator);
        const rendering = renderer.render(createRequest(target));

        await Promise.resolve();
        renderer.skip(target);
        await rendering;

        expect(Array.from(target.children, (line) => line.textContent)).toEqual([
            "Opening line",
            "Second line",
        ]);
        expect(animator.skip).toHaveBeenCalledTimes(1);
        expect(animator.animate).toHaveBeenCalledTimes(1);
    });

    it("uses default timing values when only some timing options are supplied", async () => {
        const target = document.createElement("div");
        const animator = createAnimator();
        const renderer = new StoryTextRenderer(animator);

        await renderer.render(createRequest(target, {
            text: "One line",
            options: {
                printImmediately: false,
                timeSettings: { delayPerChar: 17 },
            },
        }));

        expect(animator.animate).toHaveBeenCalledWith(
            expect.any(HTMLElement),
            "One line",
            {
                effect: DEFAULT_TEXT_RENDER_OPTIONS.effect,
                timing: {
                    ...DEFAULT_TEXT_RENDER_OPTIONS.timeSettings,
                    delayPerChar: 17,
                },
                printImmediately: false,
            },
        );
    });
});
