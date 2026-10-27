import type { StoryEnginePort } from "../../interfaces";
import { EffectEngine } from "../effects/effectEngine";
import type { Event, GameState, SceneId, StoryChoice, StoryScene } from "../../types/index";
import type { SceneDestination } from "../../types/story";

export class StoryEngine implements StoryEnginePort {
    private readonly scenes: Readonly<Record<SceneId, StoryScene>>;
    private readonly orderedSceneIds: readonly SceneId[];
    private readonly effectEngine: EffectEngine;

    constructor(scenes: Readonly<Record<SceneId, StoryScene>>) {
        this.scenes = scenes;
        this.effectEngine = new EffectEngine();
        this.orderedSceneIds = Object.values(scenes)
            .map((scene) => scene.id)
            .sort(compareSceneIds);
    }

    public getScene(sceneId: SceneId): StoryScene {
        const scene = this.scenes[sceneId];
        if (!scene) throw new Error(`The story does not contain a scene with id "${sceneId}".`);

        return scene;
    }

    private findChoice(scene: StoryScene, choiceId: string): StoryChoice {
        const choice = scene.choices.find((candidate) => candidate.id === choiceId);
        if (!choice) throw new Error(`Choice "${choiceId}" is not available in scene "${scene.id}".`);

        return choice;
    }

    private resolveDestination(destination: SceneDestination, state: GameState): { sceneId: SceneId; sceneHistory: SceneId[] } {
        const currentScene = this.getScene(state.currentSceneId);

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

        const currentIndex = this.orderedSceneIds.indexOf(currentScene.id);
        const sceneId = this.orderedSceneIds[currentIndex + 1];

        if (!sceneId) throw new Error(`There is no next scene after "${currentScene.id}".`);

        return {
            sceneId,
            sceneHistory: [...state.sceneHistory, currentScene.id],
        };
    }

    private applyEffects(state: GameState, choice: StoryChoice): Pick<GameState, "characterChoices" | "statuses" | "effects"> {
        const characterChoices = { ...state.characterChoices };
        const statuses = { ...state.statuses };

        for (const effect of choice.effects ?? []) {
            switch (effect.type) {
                case "setCharacterChoice":
                    Object.assign(characterChoices, effect.record);
                    break;
                case "applyStatus":
                    statuses[effect.status] = (statuses[effect.status] ?? 0) + effect.amount;
                    break;
                case "applyEffect":
                case "removeEffect":
                    break;
            }
        }

        return {
            characterChoices,
            statuses,
            effects: this.effectEngine.applyChoiceEffects(state.effects, choice.effects ?? []),
        };
    }

    public choose(state: GameState, choiceId: string): GameState {
        const scene = this.getScene(state.currentSceneId);
        const choice = this.findChoice(scene, choiceId);
        return this.applyChoice(state, choice, choiceId);
    }

    public chooseEvent(state: GameState, event: Event, choiceId: string): GameState {
        const choice = event.choices.find((candidate) => candidate.id === choiceId);
        if (!choice) throw new Error(`Choice "${choiceId}" is not available in event "${event.name}".`);

        return this.applyChoice(state, choice, `event:${event.id}:${choiceId}`);
    }

    private applyChoice(state: GameState, choice: StoryChoice, recordedChoiceId: string): GameState {
        const scene = this.getScene(state.currentSceneId);
        const destination = this.resolveDestination(choice.destination, state);
        const effects = this.applyEffects(state, choice);

        return {
            ...state,
            currentSceneId: destination.sceneId,
            sceneHistory: destination.sceneHistory,
            choicesMade: {
                ...state.choicesMade,
                [scene.id]: recordedChoiceId,
            },
            ...effects,
        };
    }
}

function compareSceneIds(left: SceneId, right: SceneId): number {
    const [leftChapter, leftScene] = left.split("_").map(Number);
    const [rightChapter, rightScene] = right.split("_").map(Number);

    return (leftChapter ?? 0) - (rightChapter ?? 0)
        || (leftScene ?? 0) - (rightScene ?? 0);
}
