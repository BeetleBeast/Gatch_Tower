import type { Event, SceneId } from "../types";

export interface RandomEncounterPort {
    tryRandomEncounter(currentSceneId: SceneId): Event[] | null
}