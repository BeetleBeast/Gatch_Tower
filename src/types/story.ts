import type { TextPosition, TextRenderOptionsInput } from "./text";
import type { QteConfig } from "./qte";

export type ChapterId = number;
export type SceneNumber = number;
export type SceneId = `${ChapterId}_${SceneNumber}`;

export interface StoryChoice {
    id: string;
    label: string;
    destination: SceneDestination;
    effects?: StoryEffect[];
}
export type StoryEffect =
    | { type: "setCharacterChoice"; record: Record<string, string>; }
    | { type: "applyStatus"; status: string; amount: number }
    | { type: "applyEffect"; effectId: string; kind: ActiveEffectKind; target: string; magnitude: number; durationChoices?: number }
    | { type: "removeEffect"; effectId: string };

export type ActiveEffectKind = "buff" | "debuff";

export interface ActiveEffect {
    kind: ActiveEffectKind;
    target: string;
    magnitude: number;
    remainingChoices: number | null;
}

export type SceneDestination =
    | { type: "scene"; sceneId: SceneId }
    | { type: "back" }
    | { type: 'next' };


export interface StoryScene {
    id: SceneId;
    title: string;
    text: string | string[];
    /* - text position **/
    position?: TextPosition;
    textOptions?: TextRenderOptionsInput;
    choices: StoryChoice[];
    variants?: SceneVariant[];
    contentNotice?: string;
    qte?: QteConfig;
}

interface SceneVariant {
    condition: StoryCondition;
    text: string | string[];
    choices: StoryChoice[];
}

export type StoryCondition = 
    | { type: "characterChoice"; record: Record<string, string>; }; // idk if this is ok