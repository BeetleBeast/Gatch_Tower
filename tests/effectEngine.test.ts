import { describe, expect, it } from "vitest";
import { EffectEngine } from "../src/domain/effects/effectEngine";

describe("EffectEngine", () => {
    it("stacks effects and modifies the effective status until they expire", () => {
        const engine = new EffectEngine();
        const effects = engine.applyChoiceEffects({}, [
            {
                type: "applyEffect",
                effectId: "focus-boost",
                kind: "buff",
                target: "focus",
                magnitude: 3,
                durationChoices: 2,
            },
        ]);
        const stacked = engine.applyChoiceEffects(effects, [
            {
                type: "applyEffect",
                effectId: "focus-boost",
                kind: "buff",
                target: "focus",
                magnitude: 2,
                durationChoices: 3,
            },
        ]);

        expect(stacked["focus-boost"]).toEqual({
            kind: "buff",
            target: "focus",
            magnitude: 5,
            remainingChoices: 3,
        });
        expect(engine.getEffectiveStatus("focus", { focus: 4 }, stacked)).toBe(9);

        const afterOneTurn = engine.applyChoiceEffects(stacked, []);
        expect(afterOneTurn["focus-boost"]?.remainingChoices).toBe(2);
        expect(engine.getEffectiveStatus("focus", { focus: 4 }, afterOneTurn)).toBe(9);

        const afterTwoTurns = engine.applyChoiceEffects(afterOneTurn, []);
        expect(afterTwoTurns["focus-boost"]?.remainingChoices).toBe(1);
        const expired = engine.applyChoiceEffects(afterTwoTurns, []);
        expect(expired["focus-boost"]).toBeUndefined();
        expect(engine.getEffectiveStatus("focus", { focus: 4 }, expired)).toBe(4);
    });

    it("applies debuffs, keeps permanent effects, and supports removing an effect", () => {
        const engine = new EffectEngine();
        const effects = engine.applyChoiceEffects({}, [
            { type: "applyEffect", effectId: "slow", kind: "debuff", target: "speed", magnitude: 2 },
            { type: "applyEffect", effectId: "blessing", kind: "buff", target: "speed", magnitude: 1 },
        ]);

        expect(effects.slow?.remainingChoices).toBeNull();
        expect(engine.getEffectiveStatus("speed", { speed: 5 }, effects)).toBe(4);
        expect(engine.applyChoiceEffects(effects, [{ type: "removeEffect", effectId: "slow" }]))
            .toEqual({ blessing: effects.blessing });
    });

    it("rejects invalid effect durations and magnitudes", () => {
        const engine = new EffectEngine();

        expect(() => engine.applyChoiceEffects({}, [
            { type: "applyEffect", effectId: "bad", kind: "buff", target: "focus", magnitude: 1, durationChoices: 0 },
        ])).toThrow("positive whole number");
        expect(() => engine.applyChoiceEffects({}, [
            { type: "applyEffect", effectId: "bad", kind: "buff", target: "focus", magnitude: 0 },
        ])).toThrow("greater than zero");
    });
});
