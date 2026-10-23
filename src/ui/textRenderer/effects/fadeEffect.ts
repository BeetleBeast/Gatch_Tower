import { AbstractTextEffect } from "./abstractTextEffect";
import type { TextAnimationTiming } from "../../../types/index";

const FADE_DURATION_MS = 600;

export class FadeEffect extends AbstractTextEffect {
    public override skip(target: HTMLElement): void {
        super.skip(target);
        target.classList.remove("story-text-entering");
        target.style.opacity = "";
        target.style.animationDelay = "";
    }

    protected async animate(
        target: HTMLElement,
        text: string,
        timing: TextAnimationTiming,
        signal: AbortSignal,
    ): Promise<void> {
        target.textContent = text;
        target.style.opacity = "0";
        target.style.animationDelay = `${timing.totalRevealTime}ms`;
        target.classList.remove("story-text-entering");
        void target.offsetWidth;
        target.classList.add("story-text-entering");

        await this.getClock().wait(FADE_DURATION_MS + timing.totalRevealTime, signal);

        if (!signal.aborted) {
            target.classList.remove("story-text-entering");
            target.style.opacity = "";
            target.style.animationDelay = "";
        }
    }
}