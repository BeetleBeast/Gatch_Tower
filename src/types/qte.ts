export interface QteConfig {
    amount: number;
    durationMs: number;
    countdownSeconds: number;
    input: string;
}

export type QteHitResult = "perfect" | "success" | "fail";
export type QteResultType = QteHitResult | "partial";

export interface QteSequenceResult {
    result: QteResultType;
    score: number;
    perfectCount: number;
    successCount: number;
    failCount: number;
}
