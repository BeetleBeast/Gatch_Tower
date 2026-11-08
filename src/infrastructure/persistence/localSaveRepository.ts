import type { SaveRepository } from "../../interfaces/index";
import { DEFAULT_GAME_STATUSES, STATUS_LIMITS } from "../../constants/index";
import type { ActiveCombat, ActiveEffect, GameState, QteSequenceResult, SceneId } from "../../types/index";

const SAVE_KEY = "gatch-tower.game.v7";
const PREVIOUS_SAVE_KEYS = ["gatch-tower.game.v6", "gatch-tower.game.v5", "gatch-tower.game.v4", "gatch-tower.game.v3", "gatch-tower.game.v2", "gatch-tower.game.v1"] as const;

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
    if ((candidate.schemaVersion !== 1 && candidate.schemaVersion !== 2
        && candidate.schemaVersion !== 3 && candidate.schemaVersion !== 4
        && candidate.schemaVersion !== 5 && candidate.schemaVersion !== 6
        && candidate.schemaVersion !== 7)
        || !isSceneId(candidate.currentSceneId)
        || !isStringRecord(candidate.choicesMade)) {
        return null;
    }

    const sceneHistory = candidate.sceneHistory ?? [];
    const characterChoices = candidate.characterChoices ?? {};
    const statuses = candidate.statuses ?? {};
    const savedManaUnlocked = candidate.manaUnlocked;
    const discoveries = candidate.discoveries ?? [];
    const savedDeadFlag = candidate.isDead ?? false;
    const effects = candidate.effects ?? {};
    const qteResults = candidate.qteResults ?? {};
    const activeCombat = candidate.activeCombat ?? null;
    if (!isActiveCombat(activeCombat)) return null;
    if (!Array.isArray(sceneHistory)
        || !sceneHistory.every(isSceneId)
        || !isStringRecord(characterChoices)
        || !isValidStatuses(statuses)
        || (savedManaUnlocked !== undefined && typeof savedManaUnlocked !== "boolean")
        || (candidate.schemaVersion === 6 && typeof savedManaUnlocked !== "boolean")
        || !isStringArray(discoveries)
        || typeof savedDeadFlag !== "boolean"
        || !isActiveEffectsRecord(effects)
        || !isQteResultsRecord(qteResults)
        || (candidate.schemaVersion === 7 && candidate.activeCombat === undefined)
        || (candidate.combatMessage !== undefined && typeof candidate.combatMessage !== "string")) {
        return null;
    }

    const migratedStatuses = { ...DEFAULT_GAME_STATUSES, ...statuses };
    const manaUnlocked = typeof savedManaUnlocked === "boolean"
        ? savedManaUnlocked
        : candidate.schemaVersion === 5 || (migratedStatuses.mana ?? 0) > 0;
    const isDead = savedDeadFlag || migratedStatuses.health === 0;
    if (isDead) migratedStatuses.health = 0;
    const migratedQteResults = { ...qteResults };
    migrateLegacyQteResults(migratedStatuses, migratedQteResults);

    return {
        schemaVersion: 7,
        currentSceneId: candidate.currentSceneId,
        sceneHistory,
        choicesMade: candidate.choicesMade,
        characterChoices,
        statuses: migratedStatuses,
        manaUnlocked,
        discoveries: [...new Set(discoveries)],
        isDead,
        effects,
        events: {},
        qteResults: migratedQteResults,
        activeCombat,
        ...(typeof candidate.combatMessage === "string" ? { combatMessage: candidate.combatMessage } : {}),
    };
}

function isActiveCombat(value: unknown): value is ActiveCombat | null {
    if (value === null) return true;
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const combat = value as Record<string, unknown>;
    const width = combat.width;
    const height = combat.height;
    if (typeof combat.encounterId !== "string" || combat.encounterId.trim() === ""
        || !isNonNegativeInteger(combat.seed)
        || !isPositiveInteger(width) || width > 8
        || !isPositiveInteger(height) || height > 8
        || !Array.isArray(combat.cells) || !Array.isArray(combat.units)
        || !isPositiveInteger(combat.playerActions)
        || !isNonNegativeInteger(combat.playerActionsRemaining)
        || combat.playerActionsRemaining > combat.playerActions
        || (combat.phase !== "player" && combat.phase !== "enemy" && combat.phase !== "neutral")
        || !isPositiveInteger(combat.movingCellInterval)
        || !isNonNegativeInteger(combat.actionsSinceTerrainMove)
        || (combat.result !== undefined && combat.result !== "victory" && combat.result !== "retreat" && combat.result !== "defeat")) {
        return false;
    }

    const validCells = combat.cells.every((cell) => {
        if (typeof cell !== "object" || cell === null || Array.isArray(cell)) return false;
        const candidate = cell as Record<string, unknown>;
        return isNonNegativeInteger(candidate.x) && candidate.x < width
            && isNonNegativeInteger(candidate.y) && candidate.y < height
            && (candidate.kind === "wall" || candidate.kind === "hazard" || candidate.kind === "moving");
    });
    const validUnits = combat.units.every((unit) => {
        if (typeof unit !== "object" || unit === null || Array.isArray(unit)) return false;
        const candidate = unit as Record<string, unknown>;
        if (typeof candidate.position !== "object" || candidate.position === null || Array.isArray(candidate.position)) return false;
        const position = candidate.position as Record<string, unknown>;
        return typeof candidate.id === "string" && candidate.id.trim() !== ""
            && typeof candidate.name === "string" && candidate.name.trim() !== ""
            && (candidate.side === "player" || candidate.side === "enemy" || candidate.side === "neutral")
            && isNonNegativeNumber(candidate.health)
            && isPositiveInteger(candidate.actions)
            && isNonNegativeInteger(candidate.actionsRemaining)
            && candidate.actionsRemaining <= candidate.actions
            && isPositiveNumber(candidate.damage)
            && isNonNegativeInteger(position.x) && position.x < width
            && isNonNegativeInteger(position.y) && position.y < height;
    });
    return validCells
        && validUnits
        && combat.units.some((unit) => typeof unit === "object" && unit !== null
            && (unit as Record<string, unknown>).id === "player"
            && (unit as Record<string, unknown>).side === "player");
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

function isValidStatuses(value: unknown): value is Record<string, number> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    return Object.entries(value).every(([status, entry]) => {
        if (typeof entry !== "number" || !Number.isFinite(entry)) return false;
        const limits = STATUS_LIMITS[status];
        return !limits || (entry >= limits.min && (limits.max === undefined || entry <= limits.max));
    });
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((entry) => typeof entry === "string" && entry.trim() !== "");
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

function isPositiveInteger(value: unknown): value is number {
    return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isPositiveNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value > 0;
}
