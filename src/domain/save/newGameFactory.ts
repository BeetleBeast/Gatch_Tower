import type { GameState, SceneId } from "../../types/index";
import type { GameStateFactory } from "../../interfaces/index";

export class NewGameFactory implements GameStateFactory {
    private readonly initialSceneId: SceneId;

    constructor(initialSceneId: SceneId) {
        this.initialSceneId = initialSceneId;
    }

    public create(): GameState {
        return {
            schemaVersion: 2,
            currentSceneId: this.initialSceneId,
            sceneHistory: [],
            choicesMade: {},
            characterChoices: {},
            statuses: {},
        };
    }
}
