import type { GameState, SceneId } from "../../types";
import type { GameStateFactory } from "../../interfaces";

export class NewGameFactory implements GameStateFactory {
    private readonly initialSceneId: SceneId;

    constructor(initialSceneId: SceneId) {
        this.initialSceneId = initialSceneId;
    }

    public create(): GameState {
        return {
            schemaVersion: 3,
            currentSceneId: this.initialSceneId,
            sceneHistory: [],
            choicesMade: {},
            characterChoices: {},
            statuses: {},
            effects: {},
            qteResults: {},
            events: {},
        };
    }
}
