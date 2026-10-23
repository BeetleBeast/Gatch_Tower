import { describe, expect, it, vi } from "vitest";
import type { AnimationClockPort } from "../src/interfaces/index";
import { FadeEffect } from "../src/ui/textRenderer/effects/fadeEffect";

describe("FadeEffect", () => {
    it("clears animation styling when skipped", async () => {
        const clock: AnimationClockPort = {
            now: () => 0,
            wait: vi.fn((_milliseconds: number, signal?: AbortSignal) => new Promise<void>((resolve) => {
                signal?.addEventListener("abort", () => resolve(), { once: true });
            })),
        };
        const effect = new FadeEffect(clock);
        const target = document.createElement("div");
        const animation = effect.play(target, "Faded text", {
            totalRevealTime: 100,
            cycleSpeed: 10,
            delayPerChar: 2,
        });

        await Promise.resolve();
        effect.skip(target);
        await animation;

        expect(target.textContent).toBe("Faded text");
        expect(target.classList.contains("story-text-entering")).toBe(false);
        expect(target.style.opacity).toBe("");
        expect(target.style.animationDelay).toBe("");
    });
});
