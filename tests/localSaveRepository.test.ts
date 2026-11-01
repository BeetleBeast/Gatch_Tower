import { describe, expect, it } from "vitest";
import { LocalSaveRepository } from "../src/infrastructure/persistence/localSaveRepository";
import { DEFAULT_GAME_STATUSES } from "../src/types/index";
import type { GameState } from "../src/types/index";

describe("LocalSaveRepository", () => {
    it("migrates existing version 1 saves with empty game-system state", () => {
        const storage = window.localStorage;
        storage.clear();
        storage.setItem("gatch-tower.game.v1", JSON.stringify({
            schemaVersion: 1,
            currentSceneId: "0_2",
            choicesMade: { "0_1": "continue" },
        }));
        const repository = new LocalSaveRepository(storage);

        expect(repository.load()).toEqual({
            schemaVersion: 6,
            currentSceneId: "0_2",
            sceneHistory: [],
            choicesMade: { "0_1": "continue" },
            characterChoices: {},
            statuses: DEFAULT_GAME_STATUSES,
            manaUnlocked: false,
            discoveries: [],
            isDead: false,
            effects: {},
            events: {},
            qteResults: {},
        });
        expect(JSON.parse(storage.getItem("gatch-tower.game.v6") ?? "null")).toMatchObject({
            schemaVersion: 6,
            currentSceneId: "0_2",
        });
    });

    it("persists the expanded game state for navigation, effects, and QTE results", () => {
        const storage = window.localStorage;
        storage.clear();
        const repository = new LocalSaveRepository(storage);
        const state: GameState = {
            schemaVersion: 6,
            currentSceneId: "0_1",
            sceneHistory: ["0_0"],
            choicesMade: { "0_0": "blue" },
            characterChoices: { eyes: "lightgrey" },
            statuses: { ...DEFAULT_GAME_STATUSES, health: 75, mana: 60, comprehension: 1, focus: 2 },
            manaUnlocked: true,
            discoveries: ["moss-figure"],
            isDead: false,
            effects: { focusBoost: { kind: "buff", target: "focus", magnitude: 2, remainingChoices: 3 } },
            events: {},
            qteResults: {
                "1_3": { result: "perfect", score: 2, perfectCount: 1, successCount: 0, failCount: 0 },
            },
        };

        repository.save(state);

        expect(repository.load()).toEqual(state);
    });

    it("migrates existing version 5 saves with Mana already unlocked", () => {
        const storage = window.localStorage;
        storage.clear();
        storage.setItem("gatch-tower.game.v5", JSON.stringify({
            schemaVersion: 5,
            currentSceneId: "1_2",
            choicesMade: {},
            statuses: { health: 100, mana: 0, comprehension: 0 },
        }));

        const state = new LocalSaveRepository(storage).load();

        expect(state).toMatchObject({
            schemaVersion: 6,
            statuses: { health: 100, mana: 0 },
            manaUnlocked: true,
        });
        expect(storage.getItem("gatch-tower.game.v6")).not.toBeNull();
    });

    it("migrates version 4 saves with the new death-state field", () => {
        const storage = window.localStorage;
        storage.clear();
        storage.setItem("gatch-tower.game.v4", JSON.stringify({
            schemaVersion: 4,
            currentSceneId: "1_6",
            sceneHistory: ["1_1"],
            choicesMade: {},
            characterChoices: {},
            statuses: { health: 0 },
            discoveries: ["moss-figure"],
            effects: {},
            qteResults: {},
        }));

        const state = new LocalSaveRepository(storage).load();

        expect(state).toMatchObject({
            schemaVersion: 6,
            currentSceneId: "1_6",
            statuses: { health: 0, mana: 0, comprehension: 0 },
            discoveries: ["moss-figure"],
            isDead: true,
            manaUnlocked: false,
        });
        expect(state?.statuses.pain).toBe(0);
        expect(storage.getItem("gatch-tower.game.v6")).not.toBeNull();
    });

    it("rejects saves with malformed state fields", () => {
        const storage = window.localStorage;
        storage.clear();
        storage.setItem("gatch-tower.game.v2", JSON.stringify({
            schemaVersion: 2,
            currentSceneId: "0_0",
            choicesMade: {},
            sceneHistory: ["invalid"],
        }));
        const repository = new LocalSaveRepository(storage);

        expect(() => repository.load()).toThrow(/does not match the current save format/u);
    });

    it("moves previously saved QTE counters out of statuses during save migration", () => {
        const storage = window.localStorage;
        storage.clear();
        storage.setItem("gatch-tower.game.v2", JSON.stringify({
            schemaVersion: 2,
            currentSceneId: "1_4",
            sceneHistory: ["1_3"],
            choicesMade: {},
            characterChoices: {},
            statuses: {
                focus: 4,
                "qte.1_3.score": 3,
                "qte.1_3.perfect": 1,
                "qte.1_3.success": 1,
                "qte.1_3.fail": 0,
            },
        }));

        const state = new LocalSaveRepository(storage).load();

        expect(state?.statuses).toEqual({ ...DEFAULT_GAME_STATUSES, focus: 4 });
        expect(state?.qteResults).toEqual({
            "1_3": { result: "success", score: 3, perfectCount: 1, successCount: 1, failCount: 0 },
        });
    });
});
