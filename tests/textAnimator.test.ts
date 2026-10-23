import { describe, expect, it, vi } from "vitest";
import type { AnimationClockPort, TextEffectPort } from "../src/interfaces/index";
import { TypewriterEffect } from "../src/ui/textRenderer/effects/typewriterEffect";
import { TextAnimator } from "../src/ui/textRenderer/textAnimator";
import type { TextAnimationRequest, TextEffectName } from "../src/types/index";

const request: TextAnimationRequest = {
    effect: "typewriter",
    timing: { totalRevealTime: 10, cycleSpeed: 2, delayPerChar: 1 },
    printImmediately: false,
};

function createEffect(): TextEffectPort {
    return {
        play: vi.fn(async (target: HTMLElement, text: string) => {
            target.textContent = text;
        }),
        skip: vi.fn((target: HTMLElement) => {
            target.textContent = "complete";
        }),
    };
}

function createAnimator(effect: TextEffectPort): TextAnimator {
    const effects = {
        typewriter: effect,
        fade: createEffect(),
        scramble: createEffect(),
    } satisfies Record<TextEffectName, TextEffectPort>;
    return new TextAnimator(effects);
}

describe("TextAnimator", () => {
    it("dispatches to the requested effect", async () => {
        const effect = createEffect();
        const animator = createAnimator(effect);
        const target = document.createElement("div");

        await animator.animate(target, "Hello", request);

        expect(effect.play).toHaveBeenCalledWith(target, "Hello", request.timing);
        expect(target.textContent).toBe("Hello");
    });

    it("prints immediately without starting an effect", async () => {
        const effect = createEffect();
        const animator = createAnimator(effect);
        const target = document.createElement("div");

        await animator.animate(target, "Instant", { ...request, printImmediately: true });

        expect(target.textContent).toBe("Instant");
        expect(effect.play).not.toHaveBeenCalled();
    });

    it("forwards skip to the active effect", async () => {
        const clock: AnimationClockPort = {
            now: () => 0,
            wait: vi.fn((_milliseconds: number, signal?: AbortSignal) => new Promise<void>((resolve) => {
                signal?.addEventListener("abort", () => resolve(), { once: true });
            })),
        };
        const effect = new TypewriterEffect(clock);
        const animator = createAnimator(effect);
        const target = document.createElement("div");
        const animation = animator.animate(target, "Typing", request);

        await Promise.resolve();
        animator.skip(target);
        await animation;

        expect(target.textContent).toBe("Typing");
        expect(clock.wait).toHaveBeenCalledTimes(1);
    });
});
