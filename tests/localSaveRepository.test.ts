import { describe, expect, it } from "vitest";
import { LocalSaveRepository } from "../src/infrastructure/persistence/localSaveRepository";
import type { GameState } from "../src/types/index";

describe("LocalSaveRepository", () => {
    it("migrates existing version 1 saves with empty navigation and character state", () => {
        const storage = window.localStorage;
        storage.clear();
        storage.setItem("gatch-tower.game.v1", JSON.stringify({
            schemaVersion: 1,
            currentSceneId: "0_2",
            choicesMade: { "0_1": "continue" },
        }));
        const repository = new LocalSaveRepository(storage);

        expect(repository.load()).toEqual({
            schemaVersion: 2,
            currentSceneId: "0_2",
            sceneHistory: [],
            choicesMade: { "0_1": "continue" },
            characterChoices: {},
            statuses: {},
        });
        expect(JSON.parse(storage.getItem("gatch-tower.game.v2") ?? "null")).toMatchObject({
            schemaVersion: 2,
            currentSceneId: "0_2",
        });
    });

    it("persists the expanded game state for navigation and effect handling", () => {
        const storage = window.localStorage;
        storage.clear();
        const repository = new LocalSaveRepository(storage);
        const state: GameState = {
            schemaVersion: 2,
            currentSceneId: "0_1",
            sceneHistory: ["0_0"],
            choicesMade: { "0_0": "blue" },
            characterChoices: { eyes: "lightgrey" },
            statuses: { focus: 2 },
        };

        repository.save(state);

        expect(repository.load()).toEqual(state);
    });

    it("rejects saves with malformed state fields", () => {
        const storage = window.localStorage;
        storage.clear();
        storage.setItem("gatch-tower.game.v1", JSON.stringify({
            schemaVersion: 2,
            currentSceneId: "0_0",
            choicesMade: {},
            sceneHistory: ["invalid"],
        }));
        const repository = new LocalSaveRepository(storage);

        expect(() => repository.load()).toThrow(/does not match the current save format/u);
    });
});
