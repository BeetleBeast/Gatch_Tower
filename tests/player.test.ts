import { describe, expect, it } from "vitest";
import { Player } from "../src/domain/player/player";

describe("Player", () => {
    it("validates and tracks health without exceeding its maximum", () => {
        const player = createPlayer();

        player.takeDamage(35);
        player.heal(10);
        expect(player.health).toBe(75);

        player.heal(100);
        expect(player.health).toBe(player.maxHealth);
        player.takeDamage(200);
        expect(player.health).toBe(0);
        expect(player.isAlive).toBe(false);
    });

    it("levels up, recovers from death, and caps and rests debuffs", () => {
        const player = createPlayer();

        player.levelUp(2);
        player.takeDamage(100);
        player.resurrect();
        player.applyDebuff("2", 80);
        player.applyDebuff("2", 50);
        player.applyDebuff("other", 10);
        player.rested(30);

        expect(player.level).toBe(3);
        expect(player.health).toBe(player.maxHealth);
        expect(player.debuffEffects).toEqual({ "2": 70, other: 10 });
    });

    it("rejects invalid damage and level changes", () => {
        const player = createPlayer();

        expect(() => player.takeDamage(-1)).toThrow(RangeError);
        expect(() => player.levelUp(0)).toThrow(RangeError);
    });
});

function createPlayer(): Player {
    return new Player({
        name: "Test",
        race: "Human",
        gender: "Female",
        age: 20,
        profession: "Warrior",
        attributes: { Strength: 5, Intelligence: 3, Charisma: 4, Agility: 6, Luck: 2 },
    });
}
