import type { Event, GameState, SceneId, StoryScene } from "../types/index";

export interface StoryEnginePort {
    getScene(sceneId: SceneId): StoryScene;
    getSceneForState(state: GameState): StoryScene;
    getEventForState(event: Event, state: GameState): Event;
    choose(state: GameState, choiceId: string): GameState;
    chooseEvent(state: GameState, event: Event, choiceId: string): GameState;
}
