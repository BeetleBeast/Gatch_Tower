import { describe, expect, it, vi } from "vitest";
import type { GameStateFactory, SaveRepository, StartScreenActions, StoryViewPort } from "../src/interfaces/index";
import { StartGame } from "../src/app/startGame";
import { StoryEngine } from "../src/domain/story/storyEngine";
import type { GameState, SceneId, StoryScene } from "../src/types/index";

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
            render: vi.fn((_scene, choose, completeQte) => {
                onChoice = choose;
                onQteResult = completeQte;
            }),
            showError: vi.fn(),
        };
        const game = new StartGame(
            { show: (actions) => startScreenActions.push(actions), showMessage: vi.fn(), hide: vi.fn() },
            storyView,
            saveRepository,
            gameStateFactory,
            new StoryEngine(scenes),
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
});

function createQteResult() {
    return { result: "perfect" as const, score: 2, perfectCount: 1, successCount: 0, failCount: 0 };
}
