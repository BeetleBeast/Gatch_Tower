import type { SceneId } from "./story";

export interface GameState {
    schemaVersion: 2;
    currentSceneId: SceneId;
    sceneHistory: SceneId[];
    choicesMade: Record<SceneId, string>;
    characterChoices: Record<string, string>;
    statuses: Record<string, number>;
}
