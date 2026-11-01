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
        schemaVersion: 6,
        currentSceneId,
        sceneHistory: [],
        choicesMade: {},
        characterChoices: {},
        statuses: { health: 100, mana: 100, comprehension: 0 },
        manaUnlocked: true,
        discoveries: [],
        isDead: false,
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
        expect(result.statuses).toEqual({ health: 100, mana: 100, comprehension: 0, teleportations: 1 });
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

    it("filters event choices using the same state conditions as story choices", () => {
        const event: Event = {
            id: 9,
            name: "Test",
            text: "A hidden prompt.",
            weight: 1,
            choices: [
                {
                    id: "secret",
                    label: "Reveal the secret",
                    destination: { type: "None" },
                    condition: { type: "discovery", discoveryId: "mark", discovered: true },
                },
                { id: "dismiss", label: "Dismiss", destination: { type: "None" } },
            ],
            allowed_scenes: "All",
            allowMultipleEvent: false,
            includeOriginalScene: true,
        };
        const engine = new StoryEngine(scenes);
        const state = { ...createState(), discoveries: ["mark"] };

        expect(engine.getEventForState(event, state).choices.map((choice) => choice.id)).toEqual(["secret", "dismiss"]);
        expect(() => engine.chooseEvent(createState(), event, "secret")).toThrow(/not available/u);
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
        expect(afterStatus.statuses).toEqual({ health: 100, mana: 100, comprehension: 0, focus: 2 });
    });

    it("bounds legacy influence meters when story choices change them", () => {
        const influenceScene: StoryScene = {
            id: "0_0",
            title: "Test",
            text: "A test scene.",
            choices: [{
                id: "apply-influences",
                label: "Apply influences",
                destination: { type: "None" },
                effects: [
                    { type: "applyStatus", status: "pain", amount: 10 },
                    { type: "applyStatus", status: "control", amount: -100 },
                ],
            }],
        };
        const engine = new StoryEngine({ "0_0": influenceScene });
        const initial = {
            ...createState(),
            statuses: { health: 100, mana: 100, comprehension: 0, pain: 95, control: 70 },
        };

        const result = engine.choose(initial, "apply-influences");

        expect(result.statuses.pain).toBe(100);
        expect(result.statuses.control).toBe(0);
        expect(initial.statuses.pain).toBe(95);
        expect(initial.statuses.control).toBe(70);
    });

    it("unlocks mana when it is first gained and keeps it unlocked when depleted", () => {
        const manaScene: StoryScene = {
            id: "0_0",
            title: "Mana",
            text: "A test scene.",
            choices: [
                {
                    id: "gain",
                    label: "Gain mana",
                    destination: { type: "None" },
                    effects: [{ type: "applyStatus", status: "mana", amount: 20 }],
                },
                {
                    id: "spend",
                    label: "Spend mana",
                    destination: { type: "None" },
                    effects: [{ type: "applyStatus", status: "mana", amount: -20 }],
                },
            ],
        };
        const engine = new StoryEngine({ "0_0": manaScene });
        const initial = {
            ...createState(),
            statuses: { health: 100, mana: 0, comprehension: 0 },
            manaUnlocked: false,
        };

        const gained = engine.choose(initial, "gain");
        const depleted = engine.choose(gained, "spend");

        expect(gained.statuses.mana).toBe(20);
        expect(gained.manaUnlocked).toBe(true);
        expect(depleted.statuses.mana).toBe(0);
        expect(depleted.manaUnlocked).toBe(true);
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

    it("records discoveries, clamps resource values, and reveals condition-gated choices", () => {
        const discoveryScenes: Readonly<Record<SceneId, StoryScene>> = {
            "1_0": {
                id: "1_0",
                title: "Hidden mark",
                text: "A mark is concealed in the stone.",
                hiddenText: [{ id: "mark", text: "The mark points to the exit." }],
                variants: [{
                    condition: { type: "discovery", discoveryId: "mark", discovered: true },
                    text: "The hidden mark is now clear.",
                    choices: [{
                        id: "follow",
                        label: "Follow the mark",
                        destination: { type: "next" },
                        condition: {
                            type: "statusAtLeast",
                            status: "comprehension",
                            amount: 1,
                        },
                    }],
                }],
                choices: [
                    {
                        id: "inspect",
                        label: "Inspect the mark",
                        destination: { type: "None" },
                        condition: { type: "discovery", discoveryId: "mark", discovered: false },
                        effects: [
                            { type: "discover", discoveryId: "mark" },
                            { type: "applyStatus", status: "comprehension", amount: 1 },
                            { type: "applyStatus", status: "mana", amount: -200 },
                        ],
                    },
                    {
                        id: "follow",
                        label: "Follow the mark",
                        destination: { type: "next" },
                        condition: {
                            type: "allOf",
                            conditions: [
                                { type: "discovery", discoveryId: "mark", discovered: true },
                                { type: "statusAtLeast", status: "comprehension", amount: 1 },
                            ],
                        },
                    },
                ],
            },
            "1_1": { id: "1_1", title: "Exit", text: "Outside.", choices: [] },
        };
        const engine = new StoryEngine(discoveryScenes);
        const initial = createState("1_0");

        expect(engine.getSceneForState(initial).choices.map((choice) => choice.id)).toEqual(["inspect"]);
        const discovered = engine.choose(initial, "inspect");

        expect(discovered.discoveries).toEqual(["mark"]);
        expect(discovered.statuses).toMatchObject({ comprehension: 1, mana: 0 });
        expect(engine.getSceneForState(discovered).choices.map((choice) => choice.id)).toEqual(["follow"]);
        expect(engine.getSceneForState(discovered).text).toBe("The hidden mark is now clear.");
        expect(() => engine.choose(discovered, "inspect")).toThrow(/not available/u);
    });

    it("routes direct death and zero health to the scene's game-over scene", () => {
        const deathScenes: Readonly<Record<SceneId, StoryScene>> = {
            "1_0": {
                id: "1_0",
                title: "Pool",
                text: "The water waits.",
                deathSceneId: "1_1",
                choices: [{
                    id: "fall",
                    label: "Fall in",
                    destination: { type: "death" },
                    effects: [{ type: "applyStatus", status: "health", amount: -15 }],
                }, {
                    id: "hurt",
                    label: "Take a fatal hit",
                    destination: { type: "scene", sceneId: "1_2" },
                    effects: [{ type: "applyStatus", status: "health", amount: -100 }],
                }],
            },
            "1_1": { id: "1_1", title: "Lost", text: "The end.", choices: [], gameOver: true },
            "1_2": { id: "1_2", title: "After", text: "After.", choices: [] },
        };
        const engine = new StoryEngine(deathScenes);
        const result = engine.choose(
            { ...createState("1_0"), statuses: { health: 20, mana: 100, comprehension: 0 } },
            "fall",
        );
        const fatalHit = engine.choose(
            { ...createState("1_0"), statuses: { health: 20, mana: 100, comprehension: 0 } },
            "hurt",
        );

        expect(result.currentSceneId).toBe("1_1");
        expect(result.statuses.health).toBe(0);
        expect(result.isDead).toBe(true);
        expect(result.sceneHistory).toEqual(["1_0"]);
        expect(fatalHit.currentSceneId).toBe("1_1");
        expect(fatalHit.statuses.health).toBe(0);
        expect(fatalHit.isDead).toBe(true);
        expect(engine.getSceneForState({ ...fatalHit, currentSceneId: "1_0" }).id).toBe("1_1");
        expect(() => engine.choose(fatalHit, "fall")).toThrow(/dead player cannot make/u);
        expect(() => engine.chooseEvent(fatalHit, {
            id: 1,
            name: "Test",
            text: "Event",
            weight: 1,
            choices: [{ id: "escape", label: "Escape", destination: { type: "scene", sceneId: "1_2" } }],
            allowed_scenes: "All",
            allowMultipleEvent: false,
            includeOriginalScene: true,
        }, "escape")).toThrow(/dead player cannot make/u);
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
