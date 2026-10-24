import type {
    GameStateFactory,
    SaveRepository,
    StartScreenActions,
    StartScreenPort,
    StoryEnginePort,
    StoryViewPort,
} from "../interfaces";
import type { GameState, QteSequenceResult, SceneId, StoryScene } from "../types";

export class StartGame {
    private readonly startScreen: StartScreenPort;
    private readonly storyView: StoryViewPort;
    private readonly saveRepository: SaveRepository;
    private readonly newGameFactory: GameStateFactory;
    private readonly storyEngine: StoryEnginePort;

    constructor(
        startScreen: StartScreenPort,
        storyView: StoryViewPort,
        saveRepository: SaveRepository,
        newGameFactory: GameStateFactory,
        storyEngine: StoryEnginePort,
    ) {
        this.startScreen = startScreen;
        this.storyView = storyView;
        this.saveRepository = saveRepository;
        this.newGameFactory = newGameFactory;
        this.storyEngine = storyEngine;
    }

    public start(): void {
        const actions: StartScreenActions = {
            onContinue: () => this.continueGame(),
            onNewGame: () => this.beginNewGame(),
        }
        this.startScreen.show(actions);
    }

    private continueGame(): void {
        try {
            const state = this.saveRepository.load();
            if (!state) return this.startScreen.showMessage("There is no TypeScript save yet. Start a new game.");

            this.openGame(state);
        } catch (error) {
            this.reportError("Could not load the save.", error, this.startScreen);
        }
    }

    private beginNewGame(): void {
        try {
            const state = this.newGameFactory.create();
            this.saveRepository.save(state);
            this.openGame(state);
        } catch (error) {
            this.reportError("Could not start a new game.", error, this.startScreen);
        }
    }

    private openGame(state: GameState): void {
        try {
            const scene = this.storyEngine.getScene(state.currentSceneId);
            this.startScreen.hide();
            this.renderScene(state, scene);
        } catch (error) {
            this.reportError("Could not open this scene.", error, this.startScreen);
        }
    }

    private choose(state: GameState, choiceId: string): void {
        try {
            const nextState = this.storyEngine.choose(state, choiceId);
            this.saveRepository.save(nextState);
            const nextScene = this.storyEngine.getScene(nextState.currentSceneId);
            this.renderScene(nextState, nextScene);
        } catch (error) {
            this.reportError("Could not save or advance this choice.", error, this.storyView);
        }
    }

    private renderScene(state: GameState, scene: StoryScene): void {
        let sceneState = state;
        this.storyView.render(
            scene,
            (choiceId) => this.choose(sceneState, choiceId),
            (result) => {
                sceneState = this.saveQteResult(sceneState, scene.id, result);
            },
            state.effects,
        );
    }

    private saveQteResult(state: GameState, sceneId: SceneId, result: QteSequenceResult): GameState {
        const updatedState: GameState = {
            ...state,
            qteResults: {
                ...state.qteResults,
                [sceneId]: result,
            },
        };

        try {
            this.saveRepository.save(updatedState);
        } catch (error) {
            this.reportError("Could not save the quick-time event result.", error, this.storyView);
        }

        return updatedState;
    }

    private reportError(message: string, error: unknown, target: StartScreenPort | StoryViewPort): void {
        console.error(message, error);

        if ("showMessage" in target) target.showMessage(`${message} Check the console for details.`);
        else target.showError(`${message} Check the console for details.`);
    }
}
