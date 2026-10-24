import type { QteConfig, QteSequenceResult } from "../types/index";

export interface QteViewPort {
    play(container: HTMLElement, config: QteConfig, signal: AbortSignal): Promise<QteSequenceResult>;
}
