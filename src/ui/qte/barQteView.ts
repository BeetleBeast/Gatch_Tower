import type { QteSequence } from "../../domain/qte/qteSequence";
import type { QteViewPort } from "../../interfaces/index";
import type { QteConfig, QteHitResult, QteSequenceResult } from "../../types/index";

const BAR_WIDTH = 500;
const MARKER_WIDTH = 10;
const PERFECT_START = 0.46;
const PERFECT_END = 0.54;
const SUCCESS_START = 0.40;
const SUCCESS_END = 0.60;

export class BarQteView implements QteViewPort {
    private readonly sequence: QteSequence;

    constructor(sequence: QteSequence) {
        this.sequence = sequence;
    }

    public play(
        container: HTMLElement,
        config: QteConfig,
        signal: AbortSignal,
    ): Promise<QteSequenceResult> {
        container.replaceChildren();

        const prompt = document.createElement("p");
        prompt.className = "qte-prompt";
        prompt.setAttribute("aria-live", "polite");
        container.append(prompt);

        return this.sequence.run(
            config,
            (roundIndex, roundSignal) => this.runRound(container, prompt, config, roundIndex, roundSignal),
            (secondsRemaining) => {
                prompt.textContent = `QTE starting in ${secondsRemaining}...`;
            },
            signal,
        );
    }

    private runRound(
        container: HTMLElement,
        prompt: HTMLElement,
        config: QteConfig,
        roundIndex: number,
        signal: AbortSignal,
    ): Promise<QteHitResult> {
        return new Promise((resolve, reject) => {
            if (signal.aborted) {
                reject(signal.reason ?? new DOMException("The QTE round was cancelled.", "AbortError"));
                return;
            }

            const round = document.createElement("section");
            round.className = "qte-round";
            round.setAttribute("aria-label", `Quick-time event ${roundIndex + 1} of ${config.amount}`);

            const instructions = document.createElement("p");
            instructions.className = "qte-instructions";
            instructions.textContent = `Press ${formatInput(config.input)} when the marker reaches the target, or click the bar.`;

            const bar = document.createElement("div");
            bar.className = "qte-bar";
            bar.setAttribute("role", "progressbar");
            bar.setAttribute("aria-label", "Moving QTE marker");
            bar.setAttribute("aria-valuemin", "0");
            bar.setAttribute("aria-valuemax", "100");

            const successZone = document.createElement("span");
            successZone.className = "qte-zone qte-zone--success";
            successZone.setAttribute("aria-hidden", "true");

            const perfectZone = document.createElement("span");
            perfectZone.className = "qte-zone qte-zone--perfect";
            perfectZone.setAttribute("aria-hidden", "true");

            const marker = document.createElement("span");
            marker.className = "qte-marker";
            marker.setAttribute("aria-hidden", "true");

            const resultText = document.createElement("p");
            resultText.className = "qte-result";
            resultText.setAttribute("aria-live", "assertive");

            bar.append(successZone, perfectZone, marker);
            round.append(instructions, bar, resultText);
            container.append(round);
            prompt.textContent = "";

            const startTime = window.performance.now();
            let animationId: number | undefined;
            let finished = false;

            const cleanup = (): void => {
                if (animationId !== undefined) window.cancelAnimationFrame(animationId);
                document.removeEventListener("keydown", onKeyDown);
                bar.removeEventListener("pointerdown", onPointerDown);
                signal.removeEventListener("abort", onAbort);
            };

            const finish = (result: QteHitResult): void => {
                if (finished) return;
                finished = true;
                cleanup();
                resultText.textContent = result === "perfect"
                    ? "Perfect!"
                    : result === "success"
                        ? "Success"
                        : "Miss";
                resultText.dataset.result = result;
                resolve(result);
            };

            const abort = (): void => {
                if (finished) return;
                finished = true;
                cleanup();
                reject(signal.reason ?? new DOMException("The QTE round was cancelled.", "AbortError"));
            };

            function onKeyDown(event: KeyboardEvent): void {
                if (event.code === config.input || event.key === config.input) {
                    event.preventDefault();
                    registerInput();
                }
            }

            function onPointerDown(event: PointerEvent): void {
                if (event.button === 0) {
                    event.preventDefault();
                    registerInput();
                }
            }

            function onAbort(): void {
                abort();
            }

            const registerInput = (): void => {
                const elapsed = window.performance.now() - startTime;
                const progress = Math.min(elapsed / config.durationMs, 1);
                const width = bar.getBoundingClientRect().width || BAR_WIDTH;
                const markerCenter = progress * (width - MARKER_WIDTH) + MARKER_WIDTH / 2;
                const markerPosition = markerCenter / width;
                const result = markerPosition >= PERFECT_START && markerPosition <= PERFECT_END
                    ? "perfect"
                    : markerPosition >= SUCCESS_START && markerPosition <= SUCCESS_END
                        ? "success"
                        : "fail";
                finish(result);
            };

            const animate = (now: number): void => {
                if (finished) return;
                const progress = Math.min((now - startTime) / config.durationMs, 1);
                const width = bar.getBoundingClientRect().width || BAR_WIDTH;
                marker.style.left = `${progress * (width - MARKER_WIDTH)}px`;
                bar.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
                if (progress >= 1) {
                    finish("fail");
                    return;
                }
                animationId = window.requestAnimationFrame(animate);
            };

            document.addEventListener("keydown", onKeyDown);
            bar.addEventListener("pointerdown", onPointerDown);
            signal.addEventListener("abort", onAbort, { once: true });
            animationId = window.requestAnimationFrame(animate);
        });
    }
}

function formatInput(input: string): string {
    return input === "Space" ? "Space" : input;
}
