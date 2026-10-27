import { describe, expect, it } from "vitest";
import { LocalSaveRepository } from "../src/infrastructure/persistence/localSaveRepository";
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
            schemaVersion: 3,
            currentSceneId: "0_2",
            sceneHistory: [],
            choicesMade: { "0_1": "continue" },
            characterChoices: {},
            statuses: {},
            effects: {},
            events: {},
            qteResults: {},
        });
        expect(JSON.parse(storage.getItem("gatch-tower.game.v3") ?? "null")).toMatchObject({
            schemaVersion: 3,
            currentSceneId: "0_2",
        });
    });

    it("persists the expanded game state for navigation, effects, and QTE results", () => {
        const storage = window.localStorage;
        storage.clear();
        const repository = new LocalSaveRepository(storage);
        const state: GameState = {
            schemaVersion: 3,
            currentSceneId: "0_1",
            sceneHistory: ["0_0"],
            choicesMade: { "0_0": "blue" },
            characterChoices: { eyes: "lightgrey" },
            statuses: { focus: 2 },
            effects: { focusBoost: { kind: "buff", target: "focus", magnitude: 2, remainingChoices: 3 } },
            events: {},
            qteResults: {
                "1_3": { result: "perfect", score: 2, perfectCount: 1, successCount: 0, failCount: 0 },
            },
        };

        repository.save(state);

        expect(repository.load()).toEqual(state);
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

        expect(state?.statuses).toEqual({ focus: 4 });
        expect(state?.qteResults).toEqual({
            "1_3": { result: "success", score: 3, perfectCount: 1, successCount: 1, failCount: 0 },
        });
    });
});
