import type { StoryChoice } from "../types";

const CHOICE_COLORS: Readonly<Record<string, string>> = {
    blue: "#72a7ff",
    brown: "#c4946d",
    green: "#70d28b",
    hazel: "#d2b65b",
    grey: "#d3d3d3",
    lightblue: "#87cefa",
    darkblue: "#7995d9",
    lightyellow: "#fff3a6",
    orange: "#ffae63",
    firebrick: "#ff7b70",
    beige: "#f5deb3",
    bronze: "#cd9a56",
    olive: "#bdc66d",
    pink: "#ff9bc2",
    lightbrown: "#d2a679",
    lightpink: "#ffb6c1",
    darkgrey: "#b0b0b0",
};

export interface StoryChoiceList {
    navigation: HTMLElement;
    buttons: HTMLButtonElement[];
}

export function createStoryChoiceList(
    choices: readonly StoryChoice[],
    onSelect: (choice: StoryChoice) => void,
    label: string,
    options: { eventId?: number; disabled?: boolean } = {},
): StoryChoiceList {
    const navigation = document.createElement("nav");
    navigation.className = "story-choices";
    if (options.eventId !== undefined) navigation.classList.add("story-event-choices");
    navigation.setAttribute("aria-label", label);

    const buttons = choices.map((choice, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = choice.destination.type === "back"
            ? "story-choice story-choice--back"
            : "story-choice";
        button.dataset.choiceId = choice.id;
        if (options.eventId !== undefined) {
            button.dataset.eventId = String(options.eventId);
            button.dataset.eventChoiceId = choice.id;
        }
        const choiceColor = CHOICE_COLORS[choice.id];
        if (choiceColor) button.style.color = choiceColor;
        button.textContent = `(${index + 1}) ${choice.label}`;
        button.disabled = options.disabled ?? false;
        button.addEventListener("click", () => onSelect(choice), { once: true });
        navigation.append(button);
        return button;
    });

    return { navigation, buttons };
}
