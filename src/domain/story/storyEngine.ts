import type { StoryEnginePort } from "../../interfaces";
import { EffectEngine } from "../effects/effectEngine";
import { STATUS_LIMITS } from "../../constants/index";
import type { CombatOutcomeDefinition, CombatResult, Event, GameState, SceneId, StoryChoice, StoryCondition, StoryScene } from "../../types/index";
import type { SceneDestination } from "../../types/story";

export class StoryEngine implements StoryEnginePort {
    private readonly scenes: Readonly<Record<SceneId, StoryScene>>;
    private readonly effectEngine: EffectEngine;
    private readonly discoveryIds: ReadonlySet<string>;
    private readonly gameOverSceneId: SceneId | undefined;

    constructor(scenes: Readonly<Record<SceneId, StoryScene>>, events: readonly Event[] = []) {
        this.scenes = scenes;
        this.effectEngine = new EffectEngine();
        const discoveryIds = new Set<string>();
        const gameOverScenes = Object.values(scenes).filter((scene) => scene.gameOver);
        if (gameOverScenes.length > 1) throw new Error("The story can define only one game-over scene.");
        this.gameOverSceneId = gameOverScenes[0]?.id;
        for (const [sceneKey, scene] of Object.entries(scenes)) {
            if (scene.id !== sceneKey) {
                throw new Error(`Scene key "${sceneKey}" does not match its id "${scene.id}".`);
            }
            if (scene.deathSceneId && !scenes[scene.deathSceneId]) {
                throw new Error(`Death scene "${scene.deathSceneId}" referenced by "${scene.id}" does not exist.`);
            }
            if (scene.deathSceneId && !scenes[scene.deathSceneId]?.gameOver) {
                throw new Error(`Death scene "${scene.deathSceneId}" must be marked as a game-over scene.`);
            }
            this.validateChoices(scene.choices, scene);
            for (const variant of scene.variants ?? []) this.validateChoices(variant.choices, scene);
            for (const discovery of scene.hiddenText ?? []) {
                if (discoveryIds.has(discovery.id)) throw new Error(`Discovery id "${discovery.id}" is used more than once.`);
                discoveryIds.add(discovery.id);
            }
        }
        for (const event of events) {
            for (const choice of event.choices) {
                this.validateDestination(choice.destination, undefined, `event "${event.name}"`);
            }
        }
        this.discoveryIds = discoveryIds;
    }

    private validateChoices(choices: readonly StoryChoice[], sourceScene: StoryScene): void {
        for (const choice of choices) {
            this.validateDestination(choice.destination, sourceScene, `choice "${choice.id}" in scene "${sourceScene.id}"`);
        }
    }

    private validateDestination(
        destination: SceneDestination,
        sourceScene: StoryScene | undefined,
        sourceDescription: string,
    ): void {
        if (destination.type === "scene" && !this.scenes[destination.sceneId]) {
            throw new Error(`Destination scene "${destination.sceneId}" referenced by ${sourceDescription} does not exist.`);
        }
        if (destination.type === "death" && sourceScene && !sourceScene.deathSceneId) {
            throw new Error(`${sourceDescription} uses a death destination, but the scene does not define a death scene.`);
        }
    }

    public getScene(sceneId: SceneId): StoryScene {
        const scene = this.scenes[sceneId];
        if (!scene) throw new Error(`The story does not contain a scene with id "${sceneId}".`);

        return scene;
    }

    public getSceneForState(state: GameState): StoryScene {
        if (state.isDead) {
            if (!this.gameOverSceneId) throw new Error("The story does not define a game-over scene.");
            return this.getScene(this.gameOverSceneId);
        }
        if ((state.statuses.health ?? 0) <= 0) throw new Error("A player with no Health must be marked dead.");

        const scene = this.getScene(state.currentSceneId);
        const variant = scene.variants?.find((candidate) => conditionMatches(candidate.condition, state));
        const choices = variant?.choices ?? scene.choices;

        return {
            ...scene,
            ...(variant ? { text: variant.text } : {}),
            choices: choices.filter((choice) => choiceIsAvailable(choice, state)),
        };
    }

    public getEventForState(event: Event, state: GameState): Event {
        const sourceScene = this.getScene(state.currentSceneId);
        this.validateChoices(event.choices, sourceScene);

        return {
            ...event,
            choices: event.choices.filter((choice) => choiceIsAvailable(choice, state)),
        };
    }

    private findChoice(scene: StoryScene, choiceId: string): StoryChoice {
        const choice = scene.choices.find((candidate) => candidate.id === choiceId);
        if (!choice) throw new Error(`Choice "${choiceId}" is not available in scene "${scene.id}".`);

        return choice;
    }

    private resolveDestination(
        destination: SceneDestination,
        state: GameState,
        currentScene: StoryScene,
    ): { sceneId: SceneId; sceneHistory: SceneId[] } {
        if (destination.type === "scene") {
            this.getScene(destination.sceneId);
            
            return {
                sceneId: destination.sceneId,
                sceneHistory: [...state.sceneHistory, currentScene.id],
            };
        }

        if (destination.type === "combat") {
            return { sceneId: currentScene.id, sceneHistory: [...state.sceneHistory] };
        }

        if (destination.type === "back") {
            const sceneHistory = [...state.sceneHistory];
            const sceneId = sceneHistory.pop();

            if (!sceneId) throw new Error(`There is no previous scene before "${currentScene.id}".`);

            this.getScene(sceneId);

            return { sceneId, sceneHistory };
        }

        if (destination.type === "None") {
            return { sceneId: currentScene.id, sceneHistory: [...state.sceneHistory] };
        }

        if (destination.type === "death") {
            if (!currentScene.deathSceneId) throw new Error(`Scene "${currentScene.id}" does not define a death scene.`);
            return {
                sceneId: currentScene.deathSceneId,
                sceneHistory: [...state.sceneHistory, currentScene.id],
            };
        }

        return assertNever(destination);
    }

    private applyEffects(state: GameState, choice: StoryChoice): Pick<GameState, "characterChoices" | "statuses" | "manaUnlocked" | "discoveries" | "effects"> {
        const characterChoices = { ...state.characterChoices };
        const statuses = { ...state.statuses };
        let manaUnlocked = state.manaUnlocked;
        const discoveries = [...state.discoveries];

        for (const effect of choice.effects ?? []) {
            switch (effect.type) {
                case "setCharacterChoice":
                    Object.assign(characterChoices, effect.record);
                    break;
                case "applyStatus":
                    statuses[effect.status] = clampStatus(effect.status, (statuses[effect.status] ?? 0) + effect.amount);
                    if (effect.status === "mana" && effect.amount > 0) manaUnlocked = true;
                    break;
                case "discover":
                    if (!this.discoveryIds.has(effect.discoveryId)) {
                        throw new Error(`Discovery "${effect.discoveryId}" is not defined by any scene.`);
                    }
                    if (!discoveries.includes(effect.discoveryId)) discoveries.push(effect.discoveryId);
                    break;
                case "applyEffect":
                case "removeEffect":
                    break;
            }
        }

        return {
            characterChoices,
            statuses,
            manaUnlocked,
            discoveries,
            effects: this.effectEngine.applyChoiceEffects(state.effects, choice.effects ?? []),
        };
    }

    public choose(state: GameState, choiceId: string): GameState {
        this.assertAlive(state);
        const scene = this.getSceneForState(state);
        const choice = this.findChoice(scene, choiceId);
        return this.applyChoice(state, choice, choiceId);
    }

    public chooseEvent(state: GameState, event: Event, choiceId: string): GameState {
        this.assertAlive(state);
        const choice = this.getEventForState(event, state).choices.find((candidate) => candidate.id === choiceId);
        if (!choice) throw new Error(`Choice "${choiceId}" is not available in event "${event.name}".`);

        return this.applyChoice(state, choice, `event:${event.id}:${choiceId}`);
    }

    public completeCombat(state: GameState, result: CombatResult, outcome: CombatOutcomeDefinition): GameState {
        if (!state.activeCombat) throw new Error("There is no active combat to complete.");
        const sceneId = outcome.destination ?? state.currentSceneId;
        this.getScene(sceneId);
        const statuses = { ...state.statuses };
        const player = state.activeCombat.units.find((unit) => unit.id === "player");
        statuses.health = clampStatus("health", player?.health ?? (statuses.health ?? 0));
        for (const [status, amount] of Object.entries(outcome.statusRewards ?? {})) {
            if (!Number.isFinite(amount)) throw new RangeError(`Combat reward for "${status}" must be finite.`);
            statuses[status] = clampStatus(status, (statuses[status] ?? 0) + amount);
        }

        const isDead = outcome.gameOver === true || (statuses.health ?? 0) <= 0;
        if (isDead) statuses.health = 0;
        const finalSceneId = isDead ? this.gameOverSceneId : sceneId;
        if (isDead && !finalSceneId) throw new Error("The story does not define a game-over scene for combat defeat.");
        const discoveries = [...state.discoveries];
        for (const discovery of outcome.discoveries ?? []) {
            if (!discovery.trim()) throw new Error("Combat discoveries must have non-empty ids.");
            if (!this.discoveryIds.has(discovery)) throw new Error(`Discovery "${discovery}" is not defined by any scene.`);
            if (!discoveries.includes(discovery)) discoveries.push(discovery);
        }

        const { combatMessage: _combatMessage, ...stateWithoutCombatMessage } = state;
        return {
            ...stateWithoutCombatMessage,
            currentSceneId: finalSceneId ?? sceneId,
            sceneHistory: sceneId === state.currentSceneId
                ? [...state.sceneHistory]
                : [...state.sceneHistory, state.currentSceneId],
            statuses: isDead ? { ...statuses, health: 0 } : statuses,
            discoveries,
            isDead,
            activeCombat: null,
            ...(outcome.message !== undefined ? { combatMessage: outcome.message } : {}),
        };
    }

    private applyChoice(state: GameState, choice: StoryChoice, recordedChoiceId: string): GameState {
        const scene = this.getScene(state.currentSceneId);
        const destination = this.resolveDestination(choice.destination, state, scene);
        const effects = this.applyEffects(state, choice);
        const isDirectDeath = choice.destination.type === "death";
        const statuses = isDirectDeath ? { ...effects.statuses, health: 0 } : effects.statuses;
        const isDead = isDirectDeath || (statuses.health ?? 0) <= 0;
        const deathSceneId = this.gameOverSceneId;
        if (isDead && !deathSceneId) throw new Error(`The story does not define a game-over scene for "${scene.id}".`);
        const sceneId = isDead ? deathSceneId : destination.sceneId;
        const sceneHistory = isDead && !destination.sceneHistory.includes(scene.id)
            ? [...destination.sceneHistory, scene.id]
            : destination.sceneHistory;

        const { combatMessage: _combatMessage, ...stateWithoutCombatMessage } = state;
        return {
            ...stateWithoutCombatMessage,
            currentSceneId: sceneId ?? destination.sceneId,
            sceneHistory,
            choicesMade: {
                ...state.choicesMade,
                [scene.id]: recordedChoiceId,
            },
            ...effects,
            statuses: isDead ? { ...statuses, health: 0 } : statuses,
            isDead,
        };
    }

    private assertAlive(state: GameState): void {
        if (state.isDead || (state.statuses.health ?? 0) <= 0) {
            throw new Error("A dead player cannot make story or event choices.");
        }
    }
}

function conditionMatches(condition: StoryCondition, state: GameState): boolean {
    switch (condition.type) {
        case "characterChoice":
            return Object.entries(condition.record)
                .every(([key, value]) => state.characterChoices[key] === value);
        case "discovery":
            return state.discoveries.includes(condition.discoveryId) === condition.discovered;
        case "statusAtLeast":
            return (state.statuses[condition.status] ?? 0) >= condition.amount;
        case "statusBelow":
            return (state.statuses[condition.status] ?? 0) < condition.amount;
        case "allOf":
            return condition.conditions.every((candidate) => conditionMatches(candidate, state));
    }
}

function choiceIsAvailable(choice: StoryChoice, state: GameState): boolean {
    return (choice.destination.type !== "back" || state.sceneHistory.length > 0)
        && (!choice.condition || conditionMatches(choice.condition, state));
}

function clampStatus(status: string, value: number): number {
    const limits = STATUS_LIMITS[status];
    if (!limits) return value;
    return Math.max(limits.min, Math.min(limits.max ?? Number.POSITIVE_INFINITY, value));
}

function assertNever(value: never): never {
    throw new Error(`Unsupported scene destination: ${JSON.stringify(value)}.`);
}
