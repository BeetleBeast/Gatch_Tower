import { AbstractTextEffect } from "./abstractTextEffect";
import type { TextAnimationTiming } from "../../../types/index";

const SCRAMBLE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

export class ScrambleEffect extends AbstractTextEffect {
    protected async animate(
        target: HTMLElement,
        text: string,
        timing: TextAnimationTiming,
        signal: AbortSignal,
    ): Promise<void> {
        const characters = Array.from(text);
        const cycleSpeed = Math.max(1, timing.cycleSpeed);
        const startTime = this.getClock().now();

        while (!signal.aborted) {
            const elapsed = this.getClock().now() - startTime;
            let allRevealed = true;
            const display = characters.map((character, index) => {
                if (/\s/u.test(character)) return character;

                const revealTime = timing.totalRevealTime + timing.delayPerChar * index;
                if (elapsed >= revealTime) return character;

                allRevealed = false;
                const randomIndex = Math.floor(Math.random() * SCRAMBLE_CHARACTERS.length);
                return SCRAMBLE_CHARACTERS[randomIndex] ?? character;
            }).join("");

            target.textContent = display;
            if (allRevealed) return;

            await this.getClock().wait(cycleSpeed, signal);
        }
    }
}