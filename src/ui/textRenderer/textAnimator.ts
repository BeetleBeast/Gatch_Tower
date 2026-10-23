import type { TextAnimatorPort, TextEffectPort } from "../../interfaces/index";
import type { TextAnimationRequest, TextEffectName } from "../../types/index";

export class TextAnimator implements TextAnimatorPort {
    private readonly effects: Readonly<Record<TextEffectName, TextEffectPort>>;
    private readonly activeEffects = new Map<HTMLElement, ActiveEffect>();

    constructor(effects: Readonly<Record<TextEffectName, TextEffectPort>>) {
        this.effects = effects;
    }

    public async animate(target: HTMLElement, text: string, request: TextAnimationRequest): Promise<void> {
        this.skip(target);

        if (request.printImmediately) {
            target.textContent = text;
            return;
        }

        const activeEffect = { effect: this.effects[request.effect] };
        this.activeEffects.set(target, activeEffect);

        try {
            await activeEffect.effect.play(target, text, request.timing);
        } finally {
            if (this.activeEffects.get(target) === activeEffect) this.activeEffects.delete(target);
        }
    }

    public skip(target: HTMLElement): void {
        this.activeEffects.get(target)?.effect.skip(target);
        this.activeEffects.delete(target);
    }
}

interface ActiveEffect {
    effect: TextEffectPort;
}