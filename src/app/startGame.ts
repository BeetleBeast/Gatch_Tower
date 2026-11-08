import type {
    GameStateFactory,
    SaveRepository,
    StartScreenActions,
    StartScreenPort,
    StoryEnginePort,
    StoryViewPort,
    RandomEncounterPort,
} from "../interfaces";
import type { Event, GameState, QteSequenceResult, SceneId, StoryScene } from "../types";
import type { CombatEncounterDefinition, CombatResult } from "../types";
import { CombatEngine } from "../domain/combat/combatEngine";
import type { CombatViewActions } from "../interfaces";

export class StartGame {
    private readonly startScreen: StartScreenPort;
    private readonly storyView: StoryViewPort;
    private readonly saveRepository: SaveRepository;
    private readonly newGameFactory: GameStateFactory;
    private readonly storyEngine: StoryEnginePort;
    private readonly randomEncounters: RandomEncounterPort;
    private readonly combatEngine = new CombatEngine();
    private readonly combatEncounters: Readonly<Record<string, CombatEncounterDefinition>>;

    constructor(
        startScreen: StartScreenPort,
        storyView: StoryViewPort,
        saveRepository: SaveRepository,
        newGameFactory: GameStateFactory,
        storyEngine: StoryEnginePort,
        randomEncounters: RandomEncounterPort,
        combatEncounters: Readonly<Record<string, CombatEncounterDefinition>> = {},
    ) {
        this.startScreen = startScreen;
        this.storyView = storyView;
        this.saveRepository = saveRepository;
        this.newGameFactory = newGameFactory;
        this.storyEngine = storyEngine;
        this.randomEncounters = randomEncounters;
        this.combatEncounters = combatEncounters;
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
            const scene = this.storyEngine.getSceneForState(state);
            this.startScreen.hide();
            this.renderScene(state, scene);
        } catch (error) {
            this.reportError("Could not open this scene.", error, this.startScreen);
        }
    }

    private choose(state: GameState, choiceId: string): void {
        try {
            const choice = this.storyEngine.getSceneForState(state).choices.find((candidate) => candidate.id === choiceId);
            if (!choice) throw new Error(`Choice "${choiceId}" is not available in scene "${state.currentSceneId}".`);
            const nextState = this.storyEngine.choose(state, choiceId);
            const nextCombatState = this.beginCombatIfRequested(nextState, choice.destination);
            this.saveRepository.save(nextCombatState);
            this.renderScene(nextCombatState, this.storyEngine.getSceneForState(nextCombatState));
        } catch (error) {
            this.reportError("Could not save or advance this choice.", error, this.storyView);
        }
    }

    private chooseEvent(state: GameState, event: Event, choiceId: string, currentEvents: readonly Event[]): void {
        try {
            const choice = event.choices.find((candidate) => candidate.id === choiceId);
            if (!choice) throw new Error(`Choice "${choiceId}" is not available in event "${event.name}".`);
            const nextState = this.storyEngine.chooseEvent(state, event, choiceId);
            const nextCombatState = this.beginCombatIfRequested(nextState, choice.destination);
            this.saveRepository.save(nextCombatState);
            const nextScene = this.storyEngine.getSceneForState(nextCombatState);
            const remainingEvents = choice.destination.type === "None"
                ? currentEvents.filter((candidate) => candidate.id !== event.id)
                : undefined;
            this.renderScene(nextCombatState, nextScene, remainingEvents);
        } catch (error) {
            this.reportError("Could not save or advance this event choice.", error, this.storyView);
        }
    }

    private renderScene(state: GameState, scene: StoryScene, selectedEvents?: readonly Event[]): void {
        if (state.activeCombat) {
            this.renderCombat(state);
            return;
        }
        let sceneState = state;
        const selected = state.isDead
            ? []
            : selectedEvents ?? this.randomEncounters.tryRandomEncounter(scene.id) ?? [];
        const events = selected.map((event) => this.storyEngine.getEventForState(event, state));
        this.storyView.render(
            scene,
            {
                events,
                statuses: state.statuses,
                manaUnlocked: state.manaUnlocked,
                characterChoices: state.characterChoices,
                discoveries: state.discoveries,
                activeEffects: state.effects,
                isDead: state.isDead,
                ...(state.combatMessage !== undefined ? { combatMessage: state.combatMessage } : {}),
                onChoice: (choiceId) => this.choose(sceneState, choiceId),
                onEventChoice: (event, choice) => this.chooseEvent(sceneState, event, choice.id, events),
                onRestart: () => this.beginNewGame(),
                onQteResult: (result) => {
                    sceneState = this.saveQteResult(sceneState, scene.id, result);
                },
            },
        );
    }

    private beginCombatIfRequested(
        state: GameState,
        destination: StoryScene["choices"][number]["destination"],
    ): GameState {
        if (destination.type !== "combat") return state;
        const encounter = this.combatEncounters[destination.encounterId];
        if (!encounter) throw new Error(`Combat encounter "${destination.encounterId}" is not defined.`);
        const combat = this.combatEngine.createCombat(encounter, state.statuses.health ?? encounter.player.health);
        return { ...state, activeCombat: combat };
    }

    private renderCombat(state: GameState): void {
        if (!state.activeCombat) return;
        const encounter = this.combatEncounters[state.activeCombat.encounterId];
        if (!encounter) throw new Error(`Active combat references unknown encounter "${state.activeCombat.encounterId}".`);
        if (!this.storyView.renderCombat) throw new Error("The story view does not support rendering combat.");
        const actions: CombatViewActions = {
            onMove: (unitId, destination) => this.applyCombatAction(state, (combat) => this.combatEngine.move(combat, unitId, destination)),
            onAttack: (unitId, targetId) => this.applyCombatAction(state, (combat) => this.combatEngine.attack(combat, unitId, targetId)),
            onInteract: (unitId, position) => this.applyCombatAction(state, (combat) => this.combatEngine.interact(combat, unitId, position)),
            onEndTurn: () => this.applyCombatAction(state, (combat) => this.combatEngine.endPlayerTurn(combat)),
            onRetreat: () => this.applyCombatAction(state, (combat) => this.combatEngine.retreat(combat)),
        };
        this.storyView.renderCombat(encounter, state.activeCombat, actions);
    }

    private applyCombatAction(state: GameState, action: (combat: NonNullable<GameState["activeCombat"]>) => NonNullable<GameState["activeCombat"]>): void {
        try {
            if (!state.activeCombat) throw new Error("There is no active combat.");
            const activeCombat = action(state.activeCombat);
            if (activeCombat.result) {
                const result: CombatResult = activeCombat.result;
                const encounter = this.combatEncounters[activeCombat.encounterId];
                if (!encounter) throw new Error(`Active combat references unknown encounter "${activeCombat.encounterId}".`);
                const completed = this.storyEngine.completeCombat(state, result, encounter.outcomes[result]);
                this.saveRepository.save(completed);
                this.renderScene(completed, this.storyEngine.getSceneForState(completed), []);
                return;
            }

            const updatedState: GameState = { ...state, activeCombat };
            this.saveRepository.save(updatedState);
            this.renderCombat(updatedState);
        } catch (error) {
            this.reportError("Could not complete the combat action.", error, this.storyView);
        }
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
