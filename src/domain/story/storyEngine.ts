import type { StoryEnginePort } from "../../interfaces";
import { EffectEngine } from "../effects/effectEngine";
import { STATUS_LIMITS } from "../../constants/index";
import type { Event, GameState, SceneId, StoryChoice, StoryCondition, StoryScene } from "../../types/index";
import type { SceneDestination } from "../../types/story";

export class StoryEngine implements StoryEnginePort {
    private readonly scenes: Readonly<Record<SceneId, StoryScene>>;
    private readonly orderedSceneIds: readonly SceneId[];
    private readonly effectEngine: EffectEngine;
    private readonly discoveryIds: ReadonlySet<string>;
    private readonly gameOverSceneId: SceneId | undefined;

    constructor(scenes: Readonly<Record<SceneId, StoryScene>>) {
        this.scenes = scenes;
        this.effectEngine = new EffectEngine();
        this.orderedSceneIds = Object.values(scenes)
            .map((scene) => scene.id)
            .sort(compareSceneIds);
        const discoveryIds = new Set<string>();
        const gameOverScenes = Object.values(scenes).filter((scene) => scene.gameOver);
        if (gameOverScenes.length > 1) throw new Error("The story can define only one game-over scene.");
        this.gameOverSceneId = gameOverScenes[0]?.id;
        for (const scene of Object.values(scenes)) {
            if (scene.deathSceneId && !scenes[scene.deathSceneId]) {
                throw new Error(`Death scene "${scene.deathSceneId}" referenced by "${scene.id}" does not exist.`);
            }
            if (scene.deathSceneId && !scenes[scene.deathSceneId]?.gameOver) {
                throw new Error(`Death scene "${scene.deathSceneId}" must be marked as a game-over scene.`);
            }
            for (const discovery of scene.hiddenText ?? []) {
                if (discoveryIds.has(discovery.id)) throw new Error(`Discovery id "${discovery.id}" is used more than once.`);
                discoveryIds.add(discovery.id);
            }
        }
        this.discoveryIds = discoveryIds;
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
            choices: choices.filter((choice) => !choice.condition || conditionMatches(choice.condition, state)),
        };
    }

    public getEventForState(event: Event, state: GameState): Event {
        return {
            ...event,
            choices: event.choices.filter((choice) => !choice.condition || conditionMatches(choice.condition, state)),
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

        if (destination.type === "back") {
            const sceneHistory = [...state.sceneHistory];
            const sceneId = sceneHistory.pop() ?? this.orderedSceneIds[this.orderedSceneIds.indexOf(currentScene.id) - 1];
            
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

        const currentIndex = this.orderedSceneIds.indexOf(currentScene.id);
        const sceneId = this.orderedSceneIds[currentIndex + 1];

        if (!sceneId) throw new Error(`There is no next scene after "${currentScene.id}".`);

        return {
            sceneId,
            sceneHistory: [...state.sceneHistory, currentScene.id],
        };
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

        return {
            ...state,
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

function clampStatus(status: string, value: number): number {
    const limits = STATUS_LIMITS[status];
    if (!limits) return value;
    return Math.max(limits.min, Math.min(limits.max ?? Number.POSITIVE_INFINITY, value));
}

function compareSceneIds(left: SceneId, right: SceneId): number {
    const [leftChapter, leftScene] = left.split("_").map(Number);
    const [rightChapter, rightScene] = right.split("_").map(Number);

    return (leftChapter ?? 0) - (rightChapter ?? 0)
        || (leftScene ?? 0) - (rightScene ?? 0);
}
