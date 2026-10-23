export interface AnimationClockPort {
    now(): number;
    wait(milliseconds: number, signal?: AbortSignal): Promise<void>;
}
