import type { ActiveEffect, Event, QteSequenceResult, StoryChoice, StoryScene } from "../types/index";
import type { ActiveCombat, CombatEncounterDefinition } from "../types/index";
import type { CombatViewActions } from "./combatView";

export interface StoryViewRenderOptions {
    events: readonly Event[];
    statuses: Readonly<Record<string, number>>;
    manaUnlocked: boolean;
    characterChoices: Readonly<Record<string, string>>;
    discoveries: readonly string[];
    activeEffects: Readonly<Record<string, ActiveEffect>>;
    isDead: boolean;
    combatMessage?: string;
    onChoice: (choiceId: string) => void;
    onEventChoice: (event: Event, choice: StoryChoice) => void;
    onQteResult: (result: QteSequenceResult) => void;
    onRestart: () => void;
}

export interface StoryViewPort {
    render(scene: StoryScene, options: StoryViewRenderOptions): void;
    renderCombat?(encounter: CombatEncounterDefinition, combat: ActiveCombat, actions: CombatViewActions): void;
    showError(message: string): void;
}
