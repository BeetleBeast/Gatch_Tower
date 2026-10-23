import type { TextPosition, TextRenderOptionsInput } from "../../types/index";

/**
 * Input to the TypeScript replacement for the legacy `typeText()` function.
 * Text position and the resolved target element are explicit instead of being
 * hidden in a selector and a `sceneTexts` object.
 */
export interface TextRenderRequest {
    target: HTMLElement;
    text: string | string[];
    position: TextPosition;
    options?: TextRenderOptionsInput;
}

/** Renders story text and lets the caller skip an active animation. */
export interface TextRendererPort {
    render(request: TextRenderRequest): Promise<void>;
    skip(target: HTMLElement): void;
}