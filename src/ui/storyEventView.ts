import type { TextRendererPort, TextRenderRequest } from "../interfaces";
import type { Event, StoryChoice } from "../types";
import { createStoryChoiceList } from "./storyChoiceList";

export interface StoryEventContent {
    element: HTMLElement;
    textRequest: TextRenderRequest;
    choiceButtons: HTMLButtonElement[];
}

export class StoryEventView {
    private readonly textRenderer: TextRendererPort;

    constructor(textRenderer: TextRendererPort) {
        this.textRenderer = textRenderer;
    }

    public create(
        event: Event,
        onEventChoice: (event: Event, choice: StoryChoice) => void,
        disabled: boolean,
    ): StoryEventContent {
        const element = document.createElement("article");
        element.className = "random-event";
        element.dataset.eventId = String(event.id);

        const title = document.createElement("h2");
        title.className = "random-event__title";
        title.textContent = event.name;

        const text = document.createElement("p");
        text.className = "TextBlock";
        this.enableTextSkip(text);
        element.append(title, text);

        const choices = createStoryChoiceList(
            event.choices,
            (choice) => onEventChoice(event, choice),
            `${event.name} event choices`,
            { eventId: event.id, disabled },
        );
        element.append(choices.navigation);

        return {
            element,
            textRequest: {
                target: text,
                text: event.text,
                position: event.position ?? "Left",
                ...(event.coloring ? { options: { Coloring: event.coloring } } : {}),
            },
            choiceButtons: choices.buttons,
        };
    }

    private enableTextSkip(text: HTMLElement): void {
        text.tabIndex = 0;
        text.setAttribute("role", "button");
        text.setAttribute("aria-label", "Skip text animation");
        text.addEventListener("click", () => this.textRenderer.skip(text));
        text.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                this.textRenderer.skip(text);
            }
        });
    }
}
