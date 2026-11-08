import type { ActiveEffect, SceneId } from "./story";
import type { QteSequenceResult } from "./qte";
import type { Event } from "./Events";
import type { ActiveCombat } from "./combat";

export interface GameState {
    schemaVersion: 7;
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
    activeCombat: ActiveCombat | null;
    combatMessage?: string;
}
