import type { ActiveEffect, Event, QteSequenceResult, StoryChoice, StoryScene } from "../types/index";

export interface StoryViewRenderOptions {
    events: readonly Event[];
    activeEffects: Readonly<Record<string, ActiveEffect>>;
    onChoice: (choiceId: string) => void;
    onEventChoice: (event: Event, choice: StoryChoice) => void;
    onQteResult: (result: QteSequenceResult) => void;
}

export interface StoryViewPort {
    render(scene: StoryScene, options: StoryViewRenderOptions): void;
    showError(message: string): void;
}
