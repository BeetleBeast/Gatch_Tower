import type { GridPosition } from "../types";

export interface CombatViewActions {
    onMove: (unitId: string, destination: GridPosition) => void;
    onAttack: (unitId: string, targetId: string) => void;
    onInteract: (unitId: string, position: GridPosition) => void;
    onEndTurn: () => void;
    onRetreat: () => void;
}
