import type { TextRendererPort, TextRenderRequest } from "../interfaces";
import type { ActiveEffect, Event, StoryChoice, StoryScene } from "../types";
import { createStoryChoiceList } from "./storyChoiceList";
import { StoryEventView } from "./storyEventView";

export interface StoryContent {
    element: HTMLElement;
    textRequests: TextRenderRequest[];
    choiceButtons: HTMLButtonElement[];
    qteContainer: HTMLElement | null;
}

export class StoryContentView {
    private readonly textRenderer: TextRendererPort;
    private readonly eventView: StoryEventView;

    constructor(textRenderer: TextRendererPort) {
        this.textRenderer = textRenderer;
        this.eventView = new StoryEventView(textRenderer);
    }

    public create(
        scene: StoryScene,
        events: readonly Event[],
        activeEffects: Readonly<Record<string, ActiveEffect>>,
        onChoice: (choiceId: string) => void,
        onEventChoice: (event: Event, choice: StoryChoice) => void,
    ): StoryContent {
        const element = document.createElement("section");
        element.className = "main";

        const textRequests: TextRenderRequest[] = [];
        const choiceButtons: HTMLButtonElement[] = [];
        const includeOriginalScene = events.every((event) => event.includeOriginalScene);
        let qteContainer: HTMLElement | null = null;

        if (includeOriginalScene) {
            element.append(this.createSceneTitle(scene.title));
            const sceneText = this.createTextElement();
            element.append(sceneText);
            textRequests.push({
                target: sceneText,
                text: scene.text,
                position: scene.position ?? "Left",
                ...(scene.textOptions ? { options: scene.textOptions } : {}),
            });

            const effectList = this.createActiveEffects(activeEffects);
            if (effectList) element.append(effectList);

            if (scene.qte) {
                qteContainer = document.createElement("div");
                qteContainer.className = "qte-container";
                qteContainer.setAttribute("aria-label", "Quick-time event");
                element.append(qteContainer);
            }

            const sceneChoices = createStoryChoiceList(
                scene.choices,
                (choice) => onChoice(choice.id),
                "Story choices",
                { disabled: Boolean(scene.qte) },
            );
            choiceButtons.push(...sceneChoices.buttons);
            if (scene.choices.length === 0) {
                const note = document.createElement("p");
                note.textContent = "This is the end of the story content migrated so far.";
                sceneChoices.navigation.append(note);
            }
            element.append(sceneChoices.navigation);

            if (scene.contentNotice) {
                const notice = document.createElement("p");
                notice.className = "story-content-note";
                notice.setAttribute("role", "note");
                notice.textContent = scene.contentNotice;
                element.append(notice);
            }
        }

        for (const event of events) {
            const eventContent = this.eventView.create(
                event,
                onEventChoice,
                Boolean(includeOriginalScene && scene.qte),
            );
            element.append(eventContent.element);
            textRequests.push(eventContent.textRequest);
            choiceButtons.push(...eventContent.choiceButtons);
        }

        return { element, textRequests, choiceButtons, qteContainer };
    }

    private createSceneTitle(titleText: string): HTMLHeadingElement {
        const title = document.createElement("h1");
        title.className = "Quest_Title";
        title.textContent = titleText;
        return title;
    }

    private createTextElement(): HTMLElement {
        const text = document.createElement("p");
        text.className = "TextBlock";
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
        return text;
    }

    private createActiveEffects(activeEffects: Readonly<Record<string, ActiveEffect>>): HTMLElement | null {
        const entries = Object.entries(activeEffects);
        if (entries.length === 0) return null;

        const effectList = document.createElement("ul");
        effectList.className = "active-effects";
        effectList.setAttribute("aria-label", "Active buffs and debuffs");
        for (const [id, effect] of entries) {
            const entry = document.createElement("li");
            const modifier = effect.kind === "buff" ? "+" : "-";
            const duration = effect.remainingChoices === null
                ? "Permanent"
                : `${effect.remainingChoices} choice${effect.remainingChoices === 1 ? "" : "s"} remaining`;
            entry.textContent = `${id}: ${effect.kind} to ${effect.target} `
                + `(${modifier}${effect.magnitude}; ${duration})`;
            entry.dataset.effectKind = effect.kind;
            effectList.append(entry);
        }
        return effectList;
    }
}
