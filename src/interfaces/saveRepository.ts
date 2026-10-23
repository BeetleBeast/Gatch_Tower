import type { GameState } from "../types/index";

export interface SaveRepository {
    load(): GameState | null;
    save(state: GameState): void;
}
