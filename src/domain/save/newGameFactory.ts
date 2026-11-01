import type { GameState, SceneId } from "../../types";
import { DEFAULT_GAME_STATUSES } from "../../types";
import type { GameStateFactory } from "../../interfaces";

export class NewGameFactory implements GameStateFactory {
    private readonly initialSceneId: SceneId;

    constructor(initialSceneId: SceneId) {
        this.initialSceneId = initialSceneId;
    }

    public create(): GameState {
        return {
            schemaVersion: 6,
            currentSceneId: this.initialSceneId,
            sceneHistory: [],
            choicesMade: {},
            characterChoices: {},
            statuses: { ...DEFAULT_GAME_STATUSES },
            manaUnlocked: false,
            discoveries: [],
            isDead: false,
            effects: {},
            qteResults: {},
            events: {},
        };
    }
}
