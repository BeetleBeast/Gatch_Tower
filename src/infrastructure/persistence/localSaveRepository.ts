import type { SaveRepository } from "../../interfaces/index";
import type { ActiveEffect, GameState, QteSequenceResult, SceneId } from "../../types/index";

const SAVE_KEY = "gatch-tower.game.v3";
const PREVIOUS_SAVE_KEYS = ["gatch-tower.game.v2", "gatch-tower.game.v1"] as const;

export class LocalSaveRepository implements SaveRepository {
    private readonly storage: Storage;

    constructor(storage: Storage) {
        this.storage = storage;
    }

    public load(): GameState | null {
        const serializedState = this.storage.getItem(SAVE_KEY)
            ?? PREVIOUS_SAVE_KEYS.map((key) => this.storage.getItem(key)).find((value) => value !== null)
            ?? null;
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
    if ((candidate.schemaVersion !== 1 && candidate.schemaVersion !== 2 && candidate.schemaVersion !== 3)
        || !isSceneId(candidate.currentSceneId)
        || !isStringRecord(candidate.choicesMade)) {
        return null;
    }

    const sceneHistory = candidate.sceneHistory ?? [];
    const characterChoices = candidate.characterChoices ?? {};
    const statuses = candidate.statuses ?? {};
    const effects = candidate.effects ?? {};
    const qteResults = candidate.qteResults ?? {};
    if (!Array.isArray(sceneHistory)
        || !sceneHistory.every(isSceneId)
        || !isStringRecord(characterChoices)
        || !isNumberRecord(statuses)
        || !isActiveEffectsRecord(effects)
        || !isQteResultsRecord(qteResults)) {
        return null;
    }

    const migratedStatuses = { ...statuses };
    const migratedQteResults = { ...qteResults };
    migrateLegacyQteResults(migratedStatuses, migratedQteResults);

    return {
        schemaVersion: 3,
        currentSceneId: candidate.currentSceneId,
        sceneHistory,
        choicesMade: candidate.choicesMade,
        characterChoices,
        statuses: migratedStatuses,
        effects,
        events: {},
        qteResults: migratedQteResults,
    };
}

function migrateLegacyQteResults(
    statuses: Record<string, number>,
    qteResults: Record<SceneId, QteSequenceResult>,
): void {
    const legacyQteKeys = /^qte\.(\d+_\d+)\.(score|perfect|success|fail)$/u;
    const groups = new Map<SceneId, Partial<Record<"score" | "perfect" | "success" | "fail", number>>>();

    for (const [key, value] of Object.entries(statuses)) {
        const match = legacyQteKeys.exec(key);
        if (!match) continue;
        const sceneId = match[1];
        const field = match[2];
        if (!sceneId || !isSceneId(sceneId) || !field) continue;

        const result = groups.get(sceneId) ?? {};
        if (field === "score" || field === "perfect" || field === "success" || field === "fail") {
            result[field] = value;
        }
        groups.set(sceneId, result);
        delete statuses[key];
    }

    for (const [sceneId, result] of groups) {
        if (qteResults[sceneId]
            || result.score === undefined
            || result.perfect === undefined
            || result.success === undefined
            || result.fail === undefined) {
            continue;
        }

        const rounds = result.perfect + result.success + result.fail;
        qteResults[sceneId] = {
            score: result.score,
            perfectCount: result.perfect,
            successCount: result.success,
            failCount: result.fail,
            result: result.fail === rounds
                ? "fail"
                : result.perfect === rounds
                    ? "perfect"
                    : result.fail === 0
                        ? "success"
                        : "partial",
        };
    }
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
        && Object.values(value).every((entry) => typeof entry === "number" && Number.isFinite(entry));
}

function isActiveEffectsRecord(value: unknown): value is Record<string, ActiveEffect> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    return Object.values(value).every((entry) => {
        if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return false;
        const effect = entry as Record<string, unknown>;
        return (effect.kind === "buff" || effect.kind === "debuff")
            && typeof effect.target === "string"
            && typeof effect.magnitude === "number"
            && Number.isFinite(effect.magnitude)
            && effect.magnitude > 0
            && (effect.remainingChoices === null
                || (typeof effect.remainingChoices === "number"
                    && Number.isInteger(effect.remainingChoices)
                    && effect.remainingChoices > 0));
    });
}

function isQteResultsRecord(value: unknown): value is Record<SceneId, QteSequenceResult> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    return Object.entries(value).every(([sceneId, entry]) => {
        if (!isSceneId(sceneId) || typeof entry !== "object" || entry === null || Array.isArray(entry)) return false;
        const result = entry as Record<string, unknown>;
        return (result.result === "perfect" || result.result === "success"
            || result.result === "partial" || result.result === "fail")
            && isNonNegativeInteger(result.score)
            && isNonNegativeInteger(result.perfectCount)
            && isNonNegativeInteger(result.successCount)
            && isNonNegativeInteger(result.failCount);
    });
}

function isNonNegativeInteger(value: unknown): value is number {
    return typeof value === "number" && Number.isInteger(value) && value >= 0;
}
