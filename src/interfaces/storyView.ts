import type { StoryScene } from "../types/index";

export interface StoryViewPort {
    render(scene: StoryScene, onChoice: (choiceId: string) => void): void;
    showError(message: string): void;
}
