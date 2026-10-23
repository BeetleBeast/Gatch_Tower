import type { GameState, SceneId, StoryScene } from "../types/index";

export interface StoryEnginePort {
    getScene(sceneId: SceneId): StoryScene;
    choose(state: GameState, choiceId: string): GameState;
}
