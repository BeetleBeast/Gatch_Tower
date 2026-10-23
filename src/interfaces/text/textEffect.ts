import type { TextAnimationTiming } from "../../types/index";

export interface TextEffectPort {
    play(target: HTMLElement, text: string, timing: TextAnimationTiming): Promise<void>;
    skip(target: HTMLElement): void;
}
