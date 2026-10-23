import type { TextAnimationRequest } from "../../types/index";

export interface TextAnimatorPort {
    animate(target: HTMLElement, text: string, request: TextAnimationRequest): Promise<void>;
    skip(target: HTMLElement): void;
}