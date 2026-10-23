export type TextEffectName = "typewriter" | "fade" | "scramble";
export type TextPosition = "Left" | "Right" | "Centered" | "default";

export interface TextAnimationTiming {
    totalRevealTime: number;
    cycleSpeed: number;
    delayPerChar: number;
}

export type TextTiming = TextAnimationTiming;

export interface TextAnimationRequest {
    effect: TextEffectName;
    timing: TextAnimationTiming;
    printImmediately: boolean;
}

export interface TextPreferences {
    slowTyping: boolean;
    effect: TextEffectName;
    timing: TextAnimationTiming;
}

export interface TextRenderOptions {
    printImmediately: boolean;
    replace: boolean;
    secondaryElement: boolean;
    secondaryElementTitle: string | null;
    Coloring: TextColoringOptions;
    defaultColor: string;
    timeSettings: TextTiming;
    effect: TextEffectName;
}

export type TextRenderOptionsInput =
    & Partial<Omit<TextRenderOptions, "Coloring" | "timeSettings">>
    & {
        Coloring?: TextColoringOptions;
        timeSettings?: Partial<TextTiming>;
    };

interface TextColoringBase {
    Background: string[];
    duration: number;
    Color: string[];
}

export type TextColoringOptions =
    | (TextColoringBase & {
        OnlySnippet: true;
        snippet: string[];
    })
    | (TextColoringBase & {
        OnlySnippet: false;
    });
