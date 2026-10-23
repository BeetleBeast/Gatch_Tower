import type { AnimationClockPort, TextEffectPort } from "../../../interfaces/index";
import type { TextAnimationTiming } from "../../../types/index";

interface ActiveAnimation {
    controller: AbortController;
    text: string;
}

export abstract class AbstractTextEffect implements TextEffectPort {
    private readonly activeAnimations = new Map<HTMLElement, ActiveAnimation>();
    private readonly clock: AnimationClockPort;

    constructor(clock: AnimationClockPort) {
        this.clock = clock;
    }

    public async play(target: HTMLElement, text: string, timing: TextAnimationTiming): Promise<void> {
        this.skip(target);

        const controller = new AbortController();
        const activeAnimation = { controller, text };
        this.activeAnimations.set(target, activeAnimation);

        try {
            await this.animate(target, text, timing, controller.signal);
            if (!controller.signal.aborted) target.textContent = text;
        } finally {
            if (this.activeAnimations.get(target) === activeAnimation) {
                this.activeAnimations.delete(target);
            }
        }
    }

    public skip(target: HTMLElement): void {
        const activeAnimation = this.activeAnimations.get(target);
        if (!activeAnimation) return;

        activeAnimation.controller.abort();
        target.textContent = activeAnimation.text;
        this.activeAnimations.delete(target);
    }

    protected getClock(): AnimationClockPort {
        return this.clock;
    }

    protected abstract animate(
        target: HTMLElement,
        text: string,
        timing: TextAnimationTiming,
        signal: AbortSignal,
    ): Promise<void>;
}
