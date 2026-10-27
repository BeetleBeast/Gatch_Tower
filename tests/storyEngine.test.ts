import { describe, expect, it } from "vitest";
import { StoryEngine } from "../src/domain/story/storyEngine";
import type { Event, GameState, SceneId, StoryScene } from "../src/types/index";

const scenes: Readonly<Record<SceneId, StoryScene>> = {
    "0_0": {
        id: "0_0",
        title: "Opening",
        text: "Start",
        choices: [
            {
                id: "continue",
                label: "Continue",
                destination: { type: "next" },
                effects: [{ type: "setCharacterChoice", record: { eyes: "lightgrey" } }],
            },
            {
                id: "direct",
                label: "Jump ahead",
                destination: { type: "scene", sceneId: "1_0" },
            },
        ],
    },
    "0_1": {
        id: "0_1",
        title: "Middle",
        text: "Middle",
        choices: [
            { id: "previous", label: "Previously", destination: { type: "back" } },
            {
                id: "continue",
                label: "Continue",
                destination: { type: "next" },
                effects: [{ type: "applyStatus", status: "focus", amount: 2 }],
            },
            {
                id: "focusBoost",
                label: "Focus boost",
                destination: { type: "next" },
                effects: [{
                    type: "applyEffect",
                    effectId: "focus-boost",
                    kind: "buff",
                    target: "focus",
                    magnitude: 3,
                    durationChoices: 2,
                }],
            },
        ],
    },
    "0_2": {
        id: "0_2",
        title: "Later",
        text: "Later",
        choices: [
            { id: "previous", label: "Previously", destination: { type: "back" } },
            { id: "continue", label: "Continue", destination: { type: "next" } },
        ],
    },
    "1_0": {
        id: "1_0",
        title: "Final",
        text: "Final",
        choices: [
            { id: "previous", label: "Previously", destination: { type: "back" } },
            { id: "continue", label: "Continue", destination: { type: "next" } },
        ],
    },
};

function createState(currentSceneId: SceneId = "0_0"): GameState {
    return {
        schemaVersion: 3,
        currentSceneId,
        sceneHistory: [],
        choicesMade: {},
        characterChoices: {},
        statuses: {},
        effects: {},
        events: {},
        qteResults: {},
    };
}

describe("StoryEngine", () => {
    it("advances by numeric scene order and remembers the navigation path", () => {
        const engine = new StoryEngine(scenes);
        const state = engine.choose(createState(), "continue");

        expect(state.currentSceneId).toBe("0_1");
        expect(state.sceneHistory).toEqual(["0_0"]);
        expect(state.choicesMade).toEqual({ "0_0": "continue" });
        expect(engine.getScene(state.currentSceneId).title).toBe("Middle");
    });

    it("returns to the actual previous scene and removes it from the navigation stack", () => {
        const engine = new StoryEngine(scenes);
        const first = engine.choose(createState(), "continue");
        const second = engine.choose(first, "continue");
        const previous = engine.choose(second, "previous");

        expect(second.currentSceneId).toBe("0_2");
        expect(second.sceneHistory).toEqual(["0_0", "0_1"]);
        expect(previous.currentSceneId).toBe("0_1");
        expect(previous.sceneHistory).toEqual(["0_0"]);
        expect(previous.characterChoices).toEqual({ eyes: "lightgrey" });

        const migratedSavePrevious = engine.choose(createState("0_2"), "previous");
        expect(migratedSavePrevious.currentSceneId).toBe("0_1");
    });

    it("orders scene numbers numerically rather than lexicographically", () => {
        const outOfOrderScenes: Readonly<Record<SceneId, StoryScene>> = {
            "0_10": {
                id: "0_10",
                title: "Ten",
                text: "Ten",
                choices: [],
            },
            "0_9": {
                id: "0_9",
                title: "Nine",
                text: "Nine",
                choices: [{ id: "continue", label: "Continue", destination: { type: "next" } }],
            },
            "1_0": {
                id: "1_0",
                title: "Next chapter",
                text: "Next",
                choices: [],
            },
        };
        const engine = new StoryEngine(outOfOrderScenes);

        expect(engine.choose(createState("0_9"), "continue").currentSceneId).toBe("0_10");
    });

    it("uses explicit destinations and continues correctly after navigating back", () => {
        const engine = new StoryEngine(scenes);
        const jumped = engine.choose(createState(), "direct");

        expect(jumped.currentSceneId).toBe("1_0");
        expect(jumped.sceneHistory).toEqual(["0_0"]);

        const previous = engine.choose(jumped, "previous");
        expect(previous.currentSceneId).toBe("0_0");
        expect(previous.sceneHistory).toEqual([]);

        const continued = engine.choose(previous, "continue");
        expect(continued.currentSceneId).toBe("0_1");
        expect(continued.sceneHistory).toEqual(["0_0"]);
    });

    it("applies random event choices through the same navigation and effect rules", () => {
        const event: Event = {
            id: 7,
            name: "Teleportation",
            text: "A dev offers you a ride.",
            weight: 1,
            choices: [{
                id: "accept",
                label: "Accept",
                destination: { type: "scene", sceneId: "1_0" },
                effects: [{ type: "applyStatus", status: "teleportations", amount: 1 }],
            }],
            allowed_scenes: "All",
            allowMultipleEvent: true,
            includeOriginalScene: true,
        };
        const result = new StoryEngine(scenes).chooseEvent(createState(), event, "accept");

        expect(result.currentSceneId).toBe("1_0");
        expect(result.sceneHistory).toEqual(["0_0"]);
        expect(result.choicesMade["0_0"]).toBe("event:7:accept");
        expect(result.statuses).toEqual({ teleportations: 1 });
    });

    it("keeps the current scene when an event choice has no destination", () => {
        const event: Event = {
            id: 8,
            name: "Test",
            text: "What will you do?",
            weight: 1,
            choices: [{ id: "dismiss", label: "Dismiss", destination: { type: "None" } }],
            allowed_scenes: "All",
            allowMultipleEvent: false,
            includeOriginalScene: true,
        };
        const result = new StoryEngine(scenes).chooseEvent(createState("0_1"), event, "dismiss");

        expect(result.currentSceneId).toBe("0_1");
        expect(result.sceneHistory).toEqual([]);
    });

    it("applies selected-choice effects without mutating the prior state", () => {
        const engine = new StoryEngine(scenes);
        const initial = createState();
        const afterEyes = engine.choose(initial, "continue");
        const afterStatus = engine.choose(
            { ...afterEyes, currentSceneId: "0_1" },
            "continue",
        );

        expect(initial.characterChoices).toEqual({});
        expect(afterEyes.characterChoices).toEqual({ eyes: "lightgrey" });
        expect(afterStatus.statuses).toEqual({ focus: 2 });
    });

    it("applies timed effects and expires them as choices advance", () => {
        const engine = new StoryEngine(scenes);
        const applied = engine.choose(createState("0_1"), "focusBoost");

        expect(applied.effects["focus-boost"]).toEqual({
            kind: "buff",
            target: "focus",
            magnitude: 3,
            remainingChoices: 2,
        });

        const oneChoiceLater = engine.choose(applied, "continue");
        expect(oneChoiceLater.effects["focus-boost"]?.remainingChoices).toBe(1);

        const afterExpiry = engine.choose(oneChoiceLater, "previous");
        expect(afterExpiry.effects["focus-boost"]).toBeUndefined();
    });

    it("rejects unavailable choices, missing navigation destinations, and unknown scenes", () => {
        const engine = new StoryEngine(scenes);
        const finalState = { ...createState("1_0"), sceneHistory: [] };

        expect(() => engine.choose(createState(), "missing")).toThrow(
            'Choice "missing" is not available in scene "0_0".',
        );
        expect(() => engine.choose(finalState, "continue")).toThrow(
            'There is no next scene after "1_0".',
        );
        expect(() => engine.getScene("9_9")).toThrow(
            'The story does not contain a scene with id "9_9".',
        );
    });
});
