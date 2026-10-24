import type { ActiveEffect, StoryEffect } from "../../types/index";

export class EffectEngine {
    public applyChoiceEffects(currentEffects: Readonly<Record<string, ActiveEffect>>, storyEffects: readonly StoryEffect[]): Record<string, ActiveEffect> {
        const effects = this.advanceTurns(currentEffects);

        for (const effect of storyEffects) {
            if (effect.type === "applyEffect") {
                validateAppliedEffect(effect);
                const current = effects[effect.effectId];
                const remainingChoices = effect.durationChoices ?? null;
                if (current && (current.kind !== effect.kind || current.target !== effect.target)) throw new Error(`Effect "${effect.effectId}" cannot stack across different kinds or targets.`);


                if (current) {
                    const remainingChoicesOutput = current.remainingChoices === null || remainingChoices === null 
                        ? null : Math.max(current.remainingChoices, remainingChoices);
                    effects[effect.effectId] =  {
                        ...current,
                            kind: effect.kind,
                            target: effect.target,
                            magnitude: current.magnitude + effect.magnitude,
                            remainingChoices: remainingChoicesOutput
                    }
                } else {
                    effects[effect.effectId] = {
                        kind: effect.kind,
                        target: effect.target,
                        magnitude: effect.magnitude,
                        remainingChoices,
                    }
                }
            } else if (effect.type === "removeEffect") delete effects[effect.effectId];
        }

        return effects;
    }

    public getEffectiveStatus(status: string, baseStatuses: Readonly<Record<string, number>>, effects: Readonly<Record<string, ActiveEffect>>): number {
        return Object.values(effects).reduce((value, effect) => {
            if (effect.target !== status) return value;
            return value + (effect.kind === "buff" ? effect.magnitude : -effect.magnitude);
        }, baseStatuses[status] ?? 0);
    }

    private advanceTurns(currentEffects: Readonly<Record<string, ActiveEffect>>): Record<string, ActiveEffect> {
        const nextEffects: Record<string, ActiveEffect> = {};

        for (const [id, effect] of Object.entries(currentEffects)) {
            if (effect.remainingChoices === null) {
                nextEffects[id] = effect;
            } else if (effect.remainingChoices > 1) {
                nextEffects[id] = { ...effect, remainingChoices: effect.remainingChoices - 1 };
            }
        }

        return nextEffects;
    }
}

function validateAppliedEffect(effect: Extract<StoryEffect, { type: "applyEffect" }>): void {
    if (!effect.effectId.trim() || !effect.target.trim()) throw new Error("An effect must have a non-empty id and target status.");
    if (!Number.isFinite(effect.magnitude) || effect.magnitude <= 0) throw new RangeError("An effect magnitude must be greater than zero.");
    if (effect.durationChoices !== undefined && (!Number.isInteger(effect.durationChoices) || effect.durationChoices < 1)) {
        throw new RangeError("An effect duration must be a positive whole number of turns.");
    }
}
