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


// name is not final | not yet utilized
export interface QteContainerStyling {
    angle: string; // how much to change the angle of the container, e.g. "0deg" or "45deg"
    width: string; // how wide the container is, e.g. "100px" or "50%"
    height: string; // how tall the container is, e.g. "20px" or "10%"
    backgroundColor: string;
    color: string;
    perfectZone: {
        backgroundColor: string;
        color: string;
        sizeDifference: string; // how much smaller the perfect zone is than the success zone, e.g. "10px" or "5%"
    };
    successZone: {
        backgroundColor: string;
        color: string;
        sizeDifference: string; // how much smaller the success zone is than the whole zone, e.g. "10px" or "5%"
    };
}