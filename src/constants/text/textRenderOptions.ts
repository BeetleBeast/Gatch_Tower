import type { TextRenderOptions } from "../../types";

export const DEFAULT_TEXT_RENDER_OPTIONS: TextRenderOptions = {
    printImmediately: false,
    replace: true,
    secondaryElement: true,
    secondaryElementTitle: null,
    Coloring: {
        Color: [],
        Background: [],
        duration: 0,
        OnlySnippet: false,
    },
    defaultColor: "azure",
    timeSettings: {
        totalRevealTime: 200,
        cycleSpeed: 25,
        delayPerChar: 1
    },
    effect: "fade",
};