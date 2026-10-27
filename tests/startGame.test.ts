import { describe, expect, it, vi } from "vitest";
import type { GameStateFactory, SaveRepository, StartScreenActions, StoryViewPort } from "../src/interfaces/index";
import { StartGame } from "../src/app/startGame";
import { StoryEngine } from "../src/domain/story/storyEngine";
import type { Event, GameState, SceneId, StoryScene } from "../src/types/index";

describe("StartGame", () => {
    it("keeps a completed QTE result when the player advances the scene", () => {
        const initialState: GameState = {
            schemaVersion: 3,
            currentSceneId: "1_3",
            sceneHistory: [],
            choicesMade: {},
            characterChoices: {},
            statuses: {},
            effects: {},
            events: {},
            qteResults: {},
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
            schemaVersion: 3,
            currentSceneId: "0_0",
            sceneHistory: [],
            choicesMade: {},
            characterChoices: {},
            statuses: {},
            effects: {},
            events: {},
            qteResults: {},
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
});

function createQteResult() {
    return { result: "perfect" as const, score: 2, perfectCount: 1, successCount: 0, failCount: 0 };
}
