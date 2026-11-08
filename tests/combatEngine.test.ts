import { describe, expect, it } from "vitest";
import { CombatEngine } from "../src/domain/combat/combatEngine";
import type { ActiveCombat, CombatEncounterDefinition } from "../src/types";

describe("CombatEngine", () => {
    it("recreates fixed-seed terrain and charges each grid move", () => {
        const engine = new CombatEngine();
        const encounter = createEncounter({ map: { movableWalls: 1, hazards: 1, movingCells: 1 } });
        const first = engine.createCombat(encounter);
        const second = engine.createCombat(encounter);

        expect(first.cells).toEqual(second.cells);
        const destination = [
            { x: 0, y: 1 },
            { x: 1, y: 2 },
            { x: 1, y: 1 },
            { x: 1, y: 3 },
        ].find((position) => !first.cells.some((cell) => cell.kind !== "hazard"
            && cell.x === position.x && cell.y === position.y));
        expect(destination).toBeDefined();
        const moved = engine.move(first, "player", destination!);
        expect(moved.units.find((unit) => unit.id === "player")?.position).toEqual(destination);
        expect(moved.playerActionsRemaining).toBe(2);
    });

    it("uses the seed to choose reproducible enemy starting cells", () => {
        const engine = new CombatEngine();
        const encounter = createEncounter({
            map: { seed: 150 },
            enemies: [{ id: "crawler", name: "Crawler", side: "enemy", health: 20, actions: 1, damage: 2 }],
        });
        const first = engine.createCombat(encounter);
        const repeat = engine.createCombat(encounter);
        const otherSeed = engine.createCombat({ ...encounter, map: { ...encounter.map, seed: 151 } });
        const firstPosition = first.units.find((unit) => unit.id === "crawler")?.position;

        expect(firstPosition).toEqual(repeat.units.find((unit) => unit.id === "crawler")?.position);
        expect(firstPosition).not.toEqual(otherSeed.units.find((unit) => unit.id === "crawler")?.position);
    });

    it("runs the enemy phase automatically when the shared team counter reaches zero", () => {
        const engine = new CombatEngine();
        const encounter = createEncounter({
            player: { health: 100, actions: 1, damage: 10 },
            enemies: [{ id: "crawler", name: "Crawler", side: "enemy", health: 10, actions: 1, damage: 8, position: { x: 3, y: 2 } }],
        });
        const initial = engine.createCombat(encounter);
        const nextTurn = engine.move(initial, "player", { x: 1, y: 2 });

        expect(nextTurn.phase).toBe("player");
        expect(nextTurn.playerActionsRemaining).toBe(1);
        expect(nextTurn.units.find((unit) => unit.id === "crawler")?.position).toEqual({ x: 2, y: 1 });

        const result = engine.attack(nextTurn, "player", "crawler");
        expect(result.result).toBe("victory");
    });

    it("prevents diagonal movement through blocked corners", () => {
        const engine = new CombatEngine();
        const combat = engine.createCombat(createEncounter());
        const blocked: ActiveCombat = {
            ...combat,
            cells: [
                { kind: "wall", x: 1, y: 2 },
                { kind: "wall", x: 0, y: 1 },
            ],
        };

        expect(() => engine.move(blocked, "player", { x: 1, y: 1 })).toThrow(/between blocked tiles/u);
    });

    it("lets a unit push an adjacent movable wall", () => {
        const engine = new CombatEngine();
        const combat = engine.createCombat(createEncounter());
        const withWall: ActiveCombat = {
            ...combat,
            cells: [{ kind: "wall", x: 1, y: 2 }],
        };

        const pushed = engine.interact(withWall, "player", { x: 1, y: 2 });
        expect(pushed.cells[0]).toMatchObject({ kind: "wall", x: 2, y: 2 });
        expect(pushed.playerActionsRemaining).toBe(2);
    });

    it("charges a team action for retreat", () => {
        const result = new CombatEngine().retreat(new CombatEngine().createCombat(createEncounter()));

        expect(result.result).toBe("retreat");
        expect(result.playerActionsRemaining).toBe(2);
    });

    it("spends remaining team actions on allies", () => {
        const engine = new CombatEngine();
        const encounter = createEncounter({
            player: { health: 100, actions: 2, damage: 10 },
            allies: [{ id: "ally", name: "Ally", side: "player", health: 20, actions: 1, damage: 5, position: { x: 1, y: 1 } }],
            enemies: [{ id: "enemy", name: "Enemy", side: "enemy", health: 20, actions: 1, damage: 2, position: { x: 3, y: 2 } }],
        });
        const combat = engine.createCombat(encounter);
        const afterTeamTurn = engine.endPlayerTurn(combat);
        expect(afterTeamTurn.units.find((unit) => unit.id === "enemy")?.health).toBe(15);
        expect(afterTeamTurn.playerActionsRemaining).toBe(2);
    });

    it("lets a neutral threat attack an enemy during its own phase", () => {
        const engine = new CombatEngine();
        const combat = engine.createCombat(createEncounter({
            player: { health: 100, actions: 1, damage: 10 },
            enemies: [{ id: "enemy", name: "Enemy", side: "enemy", health: 20, actions: 1, damage: 2, position: { x: 3, y: 2 } }],
        }));
        const withNeutral: ActiveCombat = {
            ...combat,
            playerActions: 1,
            playerActionsRemaining: 1,
            units: [
                ...combat.units,
                {
                    id: "neutral",
                    name: "Neutral threat",
                    side: "neutral",
                    health: 20,
                    actions: 1,
                    actionsRemaining: 0,
                    damage: 3,
                    position: { x: 3, y: 1 },
                },
            ],
        };

        const afterTeamTurn = engine.endPlayerTurn(withNeutral);
        expect(afterTeamTurn.units.find((unit) => unit.id === "enemy")?.health).toBe(17);
        expect(afterTeamTurn.units.find((unit) => unit.id === "player")?.health).toBe(100);
        expect(afterTeamTurn.playerActionsRemaining).toBe(1);
    });
});

function createEncounter(overrides: {
    map?: Partial<CombatEncounterDefinition["map"]>;
    player?: Partial<CombatEncounterDefinition["player"]>;
    allies?: CombatEncounterDefinition["allies"];
    enemies?: CombatEncounterDefinition["enemies"];
} = {}): CombatEncounterDefinition {
    return {
        id: "test-encounter",
        title: "Test Encounter",
        description: "Test.",
        map: { width: 5, height: 5, seed: 42, ...overrides.map },
        player: { health: 100, actions: 3, damage: 10, ...overrides.player },
        allies: overrides.allies ?? [],
        enemies: overrides.enemies ?? [
            { id: "enemy", name: "Enemy", side: "enemy", health: 20, actions: 1, damage: 2, position: { x: 4, y: 2 } },
        ],
        outcomes: {
            victory: {},
            retreat: {},
            defeat: {},
        },
    };
}
