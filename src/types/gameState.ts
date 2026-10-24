import type { ActiveEffect, SceneId } from "./story";
import type { QteSequenceResult } from "./qte";

export interface GameState {
    schemaVersion: 3;
    currentSceneId: SceneId;
    sceneHistory: SceneId[];
    choicesMade: Record<SceneId, string>;
    characterChoices: Record<string, string>;
    statuses: Record<string, number>;
    effects: Record<string, ActiveEffect>;
    qteResults: Record<SceneId, QteSequenceResult>;
}
