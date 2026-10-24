import type { ActiveEffect, StoryScene } from "../types/index";
import type { QteSequenceResult } from "../types/index";

export interface StoryViewPort {
    render(
        scene: StoryScene,
        onChoice: (choiceId: string) => void,
        onQteResult: (result: QteSequenceResult) => void,
        activeEffects: Readonly<Record<string, ActiveEffect>>,
    ): void;
    showError(message: string): void;
}
