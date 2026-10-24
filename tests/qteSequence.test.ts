import { describe, expect, it, vi } from "vitest";
import type { AnimationClockPort } from "../src/interfaces/index";
import { QteSequence } from "../src/domain/qte/qteSequence";
import type { QteConfig, QteHitResult } from "../src/types/index";

const config: QteConfig = {
    amount: 3,
    durationMs: 2000,
    countdownSeconds: 2,
    input: "Space",
};

describe("QteSequence", () => {
    it("counts down, runs rounds in order, and aggregates a partial result", async () => {
        const clock: AnimationClockPort = {
            now: vi.fn(() => 0),
            wait: vi.fn(async () => undefined),
        };
        const sequence = new QteSequence(clock);
        const countdown: number[] = [];
        const rounds: number[] = [];
        const results: QteHitResult[] = ["perfect", "success", "fail"];

        const result = await sequence.run(
            config,
            async (roundIndex) => {
                rounds.push(roundIndex);
                return results[roundIndex] ?? "fail";
            },
            (secondsRemaining) => countdown.push(secondsRemaining),
            new AbortController().signal,
        );

        expect(countdown).toEqual([2, 1]);
        expect(rounds).toEqual([0, 1, 2]);
        expect(clock.wait).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
            result: "partial",
            score: 3,
            perfectCount: 1,
            successCount: 1,
            failCount: 1,
        });
    });

    it("rejects invalid configurations before starting rounds", async () => {
        const sequence = new QteSequence({
            now: () => 0,
            wait: async () => undefined,
        });

        await expect(sequence.run(
            { ...config, amount: 0 },
            vi.fn(async () => "perfect" as const),
            vi.fn(),
            new AbortController().signal,
        )).rejects.toThrow("at least one round");
    });

    it("does not start after cancellation during the countdown", async () => {
        const controller = new AbortController();
        const sequence = new QteSequence({
            now: () => 0,
            wait: async () => {
                controller.abort();
            },
        });
        const runRound = vi.fn(async () => "perfect" as const);

        await expect(sequence.run(
            config,
            runRound,
            vi.fn(),
            controller.signal,
        )).rejects.toMatchObject({ name: "AbortError" });
        expect(runRound).not.toHaveBeenCalled();
    });
});
