import type { SaveRepository } from "../../interfaces/index";
import type { GameState, SceneId } from "../../types/index";

const SAVE_KEY = "gatch-tower.game.v2";
const PREVIOUS_SAVE_KEY = "gatch-tower.game.v1";

export class LocalSaveRepository implements SaveRepository {
    private readonly storage: Storage;

    constructor(storage: Storage) {
        this.storage = storage;
    }

    public load(): GameState | null {
        const serializedState = this.storage.getItem(SAVE_KEY)
            ?? this.storage.getItem(PREVIOUS_SAVE_KEY);
        if (serializedState === null) {
            return null;
        }

        const parsedState: unknown = JSON.parse(serializedState);
        const state = migrateGameState(parsedState);
        if (!state) {
            throw new Error(`The save under "${SAVE_KEY}" does not match the current save format.`);
        }

        if (this.storage.getItem(SAVE_KEY) === null) {
            this.save(state);
        }

        return state;
    }

    public save(state: GameState): void {
        this.storage.setItem(SAVE_KEY, JSON.stringify(state));
    }
}

function migrateGameState(value: unknown): GameState | null {
    if (typeof value !== "object" || value === null) {
        return null;
    }

    const candidate = value as Record<string, unknown>;
    if ((candidate.schemaVersion !== 1 && candidate.schemaVersion !== 2)
        || !isSceneId(candidate.currentSceneId)
        || !isStringRecord(candidate.choicesMade)) {
        return null;
    }

    const sceneHistory = candidate.sceneHistory ?? [];
    const characterChoices = candidate.characterChoices ?? {};
    const statuses = candidate.statuses ?? {};
    if (!Array.isArray(sceneHistory)
        || !sceneHistory.every(isSceneId)
        || !isStringRecord(characterChoices)
        || !isNumberRecord(statuses)) {
        return null;
    }

    return {
        schemaVersion: 2,
        currentSceneId: candidate.currentSceneId,
        sceneHistory,
        choicesMade: candidate.choicesMade,
        characterChoices,
        statuses,
    };
}

function isSceneId(value: unknown): value is SceneId {
    return typeof value === "string" && /^\d+_\d+$/u.test(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
    return typeof value === "object"
        && value !== null
        && !Array.isArray(value)
        && Object.values(value).every((entry) => typeof entry === "string");
}

function isNumberRecord(value: unknown): value is Record<string, number> {
    return typeof value === "object"
        && value !== null
        && !Array.isArray(value)
        && Object.values(value).every((entry) => typeof entry === "number");
}
