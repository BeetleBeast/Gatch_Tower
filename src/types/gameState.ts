import type { ActiveEffect, SceneId } from "./story";
import type { QteSequenceResult } from "./qte";
import type { Event } from "./Events";

export interface GameState {
    schemaVersion: 3;
    currentSceneId: SceneId;
    sceneHistory: SceneId[];
    choicesMade: Record<SceneId, string>;
    characterChoices: Record<string, string>;
    statuses: Record<string, number>;
    effects: Record<string, ActiveEffect>;
    events: Record<string, Event>;
    qteResults: Record<SceneId, QteSequenceResult>;
}
