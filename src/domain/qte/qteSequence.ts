import type { AnimationClockPort } from "../../interfaces/index";
import type { QteConfig, QteHitResult, QteSequenceResult } from "../../types/index";

export type QteRoundRunner = (roundIndex: number, signal: AbortSignal) => Promise<QteHitResult>;

export class QteSequence {
    private readonly clock: AnimationClockPort;

    constructor(clock: AnimationClockPort) {
        this.clock = clock;
    }

    public async run(config: QteConfig, runRound: QteRoundRunner, onCountdown: (secondsRemaining: number) => void, signal: AbortSignal): Promise<QteSequenceResult> {
        validateConfig(config);

        for (let secondsRemaining = config.countdownSeconds; secondsRemaining > 0; secondsRemaining -= 1) {
            throwIfAborted(signal);
            onCountdown(secondsRemaining);
            await this.clock.wait(1000, signal);
        }
        throwIfAborted(signal);

        const results: QteHitResult[] = [];
        for (let roundIndex = 0; roundIndex < config.amount; roundIndex += 1) {
            throwIfAborted(signal);
            results.push(await runRound(roundIndex, signal));
        }

        const perfectCount = results.filter((result) => result === "perfect").length;
        const successCount = results.filter((result) => result === "success").length;
        const failCount = results.length - perfectCount - successCount;
        const score = perfectCount * 2 + successCount;
        const result = failCount === results.length
            ? "fail"
            : perfectCount === results.length
                ? "perfect"
                : failCount === 0
                    ? "success"
                    : "partial";

        return { result, score, perfectCount, successCount, failCount };
    }
}

function validateConfig(config: QteConfig): void {
    if (!Number.isInteger(config.amount) || config.amount < 1) {
        throw new RangeError("A QTE sequence must contain at least one round.");
    }
    if (!Number.isFinite(config.durationMs) || config.durationMs <= 0) {
        throw new RangeError("A QTE round duration must be greater than zero.");
    }
    if (!Number.isInteger(config.countdownSeconds) || config.countdownSeconds < 0) {
        throw new RangeError("A QTE countdown must be a non-negative whole number.");
    }
    if (!config.input.trim()) {
        throw new Error("A QTE input key must be provided.");
    }
}

function throwIfAborted(signal: AbortSignal): void {
    if (signal.aborted) {
        throw signal.reason ?? new DOMException("The QTE sequence was cancelled.", "AbortError");
    }
}
