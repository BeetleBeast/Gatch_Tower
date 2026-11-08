import { describe, expect, it, vi } from "vitest";
import type { GameStateFactory, SaveRepository, StartScreenActions, StoryViewPort, StoryViewRenderOptions } from "../src/interfaces/index";
import { StartGame } from "../src/app/startGame";
import { StoryEngine } from "../src/domain/story/storyEngine";
import { NewGameFactory } from "../src/domain/save/newGameFactory";
import type { Event, GameState, SceneId, StoryScene } from "../src/types/index";
import type { CombatEncounterDefinition } from "../src/types/index";

describe("StartGame", () => {
    it("starts new games with no Mana and a locked Mana display", () => {
        const state = new NewGameFactory("0_0").create();

        expect(state.statuses.mana).toBe(0);
        expect(state.manaUnlocked).toBe(false);
    });

    it("keeps a completed QTE result when the player advances the scene", () => {
        const initialState: GameState = {
            schemaVersion: 7,
            currentSceneId: "1_3",
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
            activeCombat: null,
        };
        const scenes: Readonly<Record<SceneId, StoryScene>> = {
            "1_3": {
                id: "1_3",
                title: "Danger",
                text: "A shape moves in the dark.",
                choices: [{ id: "continue", label: "Continue", destination: { type: "scene", sceneId: "1_4" } }],
                qte: { amount: 1, durationMs: 2000, countdownSeconds: 0, input: "Space" },
            },
            "1_4": { id: "1_4", title: "Safe", text: "The path clears.", choices: [] },
        };
        const savedStates: GameState[] = [];
        const saveRepository: SaveRepository = {
            load: () => null,
            save: (state) => savedStates.push(state),
        };
        const gameStateFactory: GameStateFactory = { create: () => initialState };
        const startScreenActions: StartScreenActions[] = [];
        let onChoice: ((choiceId: string) => void) | undefined;
        let onQteResult: ((result: ReturnType<typeof createQteResult>) => void) | undefined;
        const storyView: StoryViewPort = {
            render: vi.fn((_scene, options) => {
                onChoice = options.onChoice;
                onQteResult = options.onQteResult;
            }),
            showError: vi.fn(),
        };
        const game = new StartGame(
            { show: (actions) => startScreenActions.push(actions), showMessage: vi.fn(), hide: vi.fn() },
            storyView,
            saveRepository,
            gameStateFactory,
            new StoryEngine(scenes),
            { tryRandomEncounter: () => null },
        );

        game.start();
        startScreenActions[0]?.onNewGame();
        onQteResult?.(createQteResult());
        onChoice?.("continue");

        expect(savedStates.at(-1)).toMatchObject({
            currentSceneId: "1_4",
            qteResults: {
                "1_3": {
                    result: "perfect",
                    score: 2,
                    perfectCount: 1,
                    successCount: 0,
                    failCount: 0,
                },
            },
        });
    });

    it("renders random events and dismisses no-destination events without rerolling", () => {
        const event: Event = {
            id: 5,
            name: "Test",
            text: "A brief interruption.",
            weight: 1,
            choices: [{ id: "dismiss", label: "Dismiss", destination: { type: "None" } }],
            allowed_scenes: "All",
            allowMultipleEvent: false,
            includeOriginalScene: true,
        };
        const initialState: GameState = {
            schemaVersion: 7,
            currentSceneId: "0_0",
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
            activeCombat: null,
        };
        const scene: StoryScene = { id: "0_0", title: "Opening", text: "Story text", choices: [] };
        const scenes: Readonly<Record<SceneId, StoryScene>> = { "0_0": scene };
        const eventSelector = { tryRandomEncounter: vi.fn(() => [event]) };
        const renderOptions: Parameters<StoryViewPort["render"]>[1][] = [];
        const storyView: StoryViewPort = {
            render: vi.fn((_scene, options) => renderOptions.push(options)),
            showError: vi.fn(),
        };
        const startScreenActions: StartScreenActions[] = [];
        const game = new StartGame(
            { show: (actions) => startScreenActions.push(actions), showMessage: vi.fn(), hide: vi.fn() },
            storyView,
            { load: () => null, save: vi.fn() },
            { create: () => initialState },
            new StoryEngine(scenes),
            eventSelector,
        );

        game.start();
        startScreenActions[0]?.onNewGame();
        expect(renderOptions[0]?.events).toEqual([event]);
        renderOptions[0]?.onEventChoice(event, event.choices[0]!);

        expect(renderOptions).toHaveLength(2);
        expect(renderOptions[1]?.events).toEqual([]);
        expect(eventSelector.tryRandomEncounter).toHaveBeenCalledTimes(1);
    });

    it("starts a story-authored battle, saves actions, and applies its authored victory outcome", () => {
        const scenes: Readonly<Record<SceneId, StoryScene>> = {
            "0_0": {
                id: "0_0",
                title: "The passage",
                text: "A creature blocks the way.",
                choices: [{ id: "fight", label: "Fight", destination: { type: "combat", encounterId: "test" } }],
            },
            "0_1": { id: "0_1", title: "Beyond", text: "The path is clear.", choices: [] },
            "0_2": { id: "0_2", title: "Game over", text: "You fall.", choices: [], gameOver: true },
        };
        const encounter: CombatEncounterDefinition = {
            id: "test",
            title: "Test Battle",
            description: "Fight.",
            map: { width: 3, height: 3, seed: 7 },
            player: { health: 100, actions: 1, damage: 10 },
            enemies: [{ id: "target", name: "Target", side: "enemy", health: 10, actions: 1, damage: 1, position: { x: 1, y: 1 } }],
            outcomes: {
                victory: { destination: "0_1", message: "You win.", statusRewards: { health: 5 } },
                retreat: { destination: "0_0" },
                defeat: { destination: "0_2" },
            },
        };
        const initialState: GameState = {
            schemaVersion: 7,
            currentSceneId: "0_0",
            sceneHistory: [],
            choicesMade: {},
            characterChoices: {},
            statuses: { health: 80, mana: 0 },
            manaUnlocked: false,
            discoveries: [],
            isDead: false,
            effects: {},
            events: {},
            qteResults: {},
            activeCombat: null,
        };
        const savedStates: GameState[] = [];
        const renderOptions: StoryViewRenderOptions[] = [];
        let combatActions: Parameters<NonNullable<StoryViewPort["renderCombat"]>>[2] | undefined;
        const storyView: StoryViewPort = {
            render: vi.fn((_scene, options) => renderOptions.push(options)),
            renderCombat: vi.fn((_encounter, _combat, actions) => {
                combatActions = actions;
            }),
            showError: vi.fn(),
        };
        const startActions: StartScreenActions[] = [];
        const game = new StartGame(
            { show: (actions) => startActions.push(actions), showMessage: vi.fn(), hide: vi.fn() },
            storyView,
            { load: () => null, save: (state) => savedStates.push(state) },
            { create: () => initialState },
            new StoryEngine(scenes),
            { tryRandomEncounter: () => null },
            { test: encounter },
        );

        game.start();
        startActions[0]?.onNewGame();
        renderOptions[0]?.onChoice("fight");
        expect(combatActions).toBeDefined();
        expect(savedStates.at(-1)?.activeCombat?.encounterId).toBe("test");

        combatActions?.onAttack("player", "target");
        expect(renderOptions.at(-1)?.combatMessage).toBe("You win.");
        expect(savedStates.at(-1)).toMatchObject({
            currentSceneId: "0_1",
            activeCombat: null,
            statuses: { health: 85 },
        });
    });
});

function createQteResult() {
    return { result: "perfect" as const, score: 2, perfectCount: 1, successCount: 0, failCount: 0 };
}
