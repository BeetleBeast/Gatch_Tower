import type { AnimationClockPort } from "../../interfaces/index";

export class AnimationClock implements AnimationClockPort {
    public now(): number {
        return window.performance.now();
    }

    public wait(milliseconds: number, signal?: AbortSignal): Promise<void> {
        return new Promise((resolve) => {
            if (signal?.aborted) {
                resolve();
                return;
            }

            const finish = (): void => {
                window.clearTimeout(timer);
                signal?.removeEventListener("abort", finish);
                resolve();
            };
            const timer = window.setTimeout(finish, Math.max(0, milliseconds));
            signal?.addEventListener("abort", finish, { once: true });
        });
    }
}