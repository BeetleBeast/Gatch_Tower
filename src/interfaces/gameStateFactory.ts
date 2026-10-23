import type { GameState } from "../types/index";

export interface GameStateFactory {
    create(): GameState;
}
