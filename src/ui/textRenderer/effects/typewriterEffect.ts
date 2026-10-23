import { AbstractTextEffect } from "./abstractTextEffect";
import type { TextAnimationTiming } from "../../../types/index";

export class TypewriterEffect extends AbstractTextEffect {

    private readonly delayCharacters = [".", ","];

    protected async animate(target: HTMLElement, text: string, timing: TextAnimationTiming, signal: AbortSignal): Promise<void> {
        target.textContent = "";

        for (const character of text) {
            if (signal.aborted) return;

            target.append(document.createTextNode(character));
            const delay = this.delayCharacters.includes(character) ? 400 : timing.delayPerChar;
            await this.getClock().wait(delay, signal);
        }
    }
}