import type { CombatEncounterDefinition } from "../types";

export const COMBAT_ENCOUNTERS: Readonly<Record<string, CombatEncounterDefinition>> = {
    mossCrawler: {
        id: "mossCrawler",
        title: "The Moss Crawler",
        description: "A cave crawler blocks the mossy passage. Move onto an adjacent tile and strike when you are ready.",
        map: {
            width: 5,
            height: 5,
            seed: 1042,
            movableWalls: 1,
            hazards: 1,
            movingCells: 1,
        },
        player: { health: 100, actions: 3, damage: 10 },
        allies: [{
            id: "moss-ally",
            name: "Mossling",
            side: "player",
            health: 20,
            actions: 1,
            damage: 5,
            position: { x: 1, y: 1 },
        }],
        enemies: [{
            id: "crawler",
            name: "Cave Crawler",
            side: "enemy",
            health: 20,
            actions: 2,
            damage: 8,
        }],
        outcomes: {
            victory: {
                message: "The passage is quiet again. You continue toward the hidden alcove.",
                destination: "1_6",
                statusRewards: { health: 10 },
            },
            retreat: {
                message: "You fall back to the mossy passage.",
                destination: "1_1",
            },
            defeat: {
                message: "The cave crawler overpowers you.",
                destination: "1_8",
                gameOver: true,
            },
        },
    },
};
