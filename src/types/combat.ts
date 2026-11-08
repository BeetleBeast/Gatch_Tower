import type { SceneId } from "./story";

export type CombatSide = "player" | "enemy" | "neutral";
export type CombatPhase = "player" | "enemy" | "neutral";
export type CombatResult = "victory" | "retreat" | "defeat";
export type CombatTerrainKind = "wall" | "hazard" | "moving";

export interface GridPosition {
    x: number;
    y: number;
}

export interface CombatUnitDefinition {
    id: string;
    name: string;
    side: CombatSide;
    health: number;
    actions: number;
    damage: number;
    position?: GridPosition;
}

export interface CombatOutcomeDefinition {
    message?: string;
    destination?: SceneId;
    statusRewards?: Record<string, number>;
    discoveries?: string[];
    gameOver?: boolean;
}

export interface CombatEncounterDefinition {
    id: string;
    title: string;
    description: string;
    map: {
        width: number;
        height: number;
        seed?: number;
        randomizeSeed?: boolean;
        movableWalls?: number;
        hazards?: number;
        movingCells?: number;
        movingCellInterval?: number;
    };
    player: {
        health: number;
        actions: number;
        damage: number;
    };
    allies?: CombatUnitDefinition[];
    enemies: CombatUnitDefinition[];
    outcomes: Record<CombatResult, CombatOutcomeDefinition>;
}

export interface CombatCell extends GridPosition {
    kind: CombatTerrainKind;
}

export interface CombatUnit extends CombatUnitDefinition {
    side: CombatSide;
    health: number;
    position: GridPosition;
    actionsRemaining: number;
}

export interface ActiveCombat {
    encounterId: string;
    seed: number;
    width: number;
    height: number;
    cells: CombatCell[];
    units: CombatUnit[];
    playerActions: number;
    playerActionsRemaining: number;
    phase: CombatPhase;
    movingCellInterval: number;
    actionsSinceTerrainMove: number;
    result?: CombatResult;
}
