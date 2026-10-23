import { describe, expect, it } from "vitest";
import { storyScenes } from "../src/content/scenes";

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
