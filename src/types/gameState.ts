import type { ActiveEffect, SceneId } from "./story";
import type { QteSequenceResult } from "./qte";
import type { Event } from "./events";

export interface GameState {
    schemaVersion: 6;
    currentSceneId: SceneId;
    sceneHistory: SceneId[];
    choicesMade: Record<SceneId, string>;
    characterChoices: Record<string, string>;
    statuses: Record<string, number>;
    manaUnlocked: boolean;
    discoveries: string[];
    isDead: boolean;
    effects: Record<string, ActiveEffect>;
    events: Record<string, Event>;
    qteResults: Record<SceneId, QteSequenceResult>;
}
