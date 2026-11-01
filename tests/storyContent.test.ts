import { describe, expect, it } from "vitest";
import { storyScenes } from "../src/content/scenes";
import { NewGameFactory } from "../src/domain/save/newGameFactory";
import { StoryEngine } from "../src/domain/story/storyEngine";

describe("migrated story content", () => {
    it("includes the supported opening scenes through the first feature boundary", () => {
        expect(Object.keys(storyScenes)).toEqual([
            "0_0",
            "0_1",
            "0_2",
            "0_3",
            "0_4",
            "0_5",
            "0_6",
            "0_7",
            "0_8",
            "0_9",
            "1_0",
            "1_1",
            "1_2",
            "1_3",
            "1_4",
            "1_5",
            "1_6",
            "1_7",
            "1_8",
            "1_9",
            "1_10",
            "1_12",
        ]);
    });

    it("does not contain explicit destinations outside the migrated content", () => {
        for (const scene of Object.values(storyScenes)) {
            for (const choice of scene.choices) {
                if (choice.destination.type === "scene") {
                    expect(storyScenes[choice.destination.sceneId]).toBeDefined();
                }
            }
        }
    });

    it("uses supported discovery, resource-check, and death mechanics in the cave", () => {
        expect(storyScenes["1_6"]?.hiddenText).toHaveLength(1);
        expect(storyScenes["1_7"]?.choices.find((choice) => choice.id === "followFigure")?.condition)
            .toEqual({
                type: "allOf",
                conditions: [
                    { type: "discovery", discoveryId: "moss-figure", discovered: true },
                    { type: "statusAtLeast", status: "comprehension", amount: 1 },
                ],
            });
        expect(storyScenes["1_7"]?.choices.find((choice) => choice.id === "enterPool")?.destination)
            .toEqual({ type: "death" });
        expect(storyScenes["1_8"]?.gameOver).toBe(true);
        expect(storyScenes["1_2"]?.choices.find((choice) => choice.id === "resonate")?.condition?.type)
            .toBe("allOf");
    });

    it("supports the moss discovery, crystal checks, and pool death in play", () => {
        const engine = new StoryEngine(storyScenes);
        const mossScene = new NewGameFactory("1_6").create();
        const discovered = engine.choose(mossScene, "feelMoss");
        const pool = engine.choose(discovered, "continue");

        expect(discovered.discoveries).toContain("moss-figure");
        expect(discovered.statuses.comprehension).toBe(1);
        expect(engine.getSceneForState(pool).choices.map((choice) => choice.id)).toEqual(["followFigure"]);
        expect(engine.choose(pool, "followFigure").currentSceneId).toBe("1_9");

        const newGame = new NewGameFactory("1_2").create();
        const crystalScene = {
            ...newGame,
            statuses: { ...newGame.statuses, mana: 30 },
            manaUnlocked: true,
        };
        const studied = engine.choose(crystalScene, "studyCrystals");
        expect(studied.statuses).toMatchObject({ mana: 20, comprehension: 1 });
        expect(engine.getSceneForState(studied).choices.map((choice) => choice.id)).toContain("resonate");
        expect(engine.choose(studied, "resonate").currentSceneId).toBe("1_10");

        const poolWithoutClue = new NewGameFactory("1_7").create();
        const drowned = engine.choose(poolWithoutClue, "enterPool");
        expect(drowned.currentSceneId).toBe("1_8");
        expect(drowned.statuses.health).toBe(0);
    });

    it("records the chosen character attributes with their legacy alternate values", () => {
        expect(storyScenes["0_2"]?.choices.find((choice) => choice.id === "grey")?.effects)
            .toEqual([{ type: "setCharacterChoice", record: { eyes: "lightgrey" } }]);
        expect(storyScenes["0_5"]?.choices.find((choice) => choice.id === "lightpink")?.effects)
            .toEqual([{ type: "setCharacterChoice", record: { stature: "lightpink" } }]);
        expect(storyScenes["0_6"]?.choices.find((choice) => choice.id === "darkgrey")?.effects)
            .toEqual([{ type: "setCharacterChoice", record: { attire: "darkgrey" } }]);
        expect(storyScenes["0_7"]?.choices.find((choice) => choice.id === "pink")?.effects)
            .toEqual([{ type: "setCharacterChoice", record: { gender: "pink" } }]);
    });
});
