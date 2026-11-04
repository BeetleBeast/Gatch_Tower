import type { TextRendererPort, TextRenderRequest } from "../../interfaces";
import type { Event, StoryChoice, StoryScene } from "../../types";
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
        discoveries: readonly string[],
        onChoice: (choiceId: string) => void,
        onEventChoice: (event: Event, choice: StoryChoice) => void,
        onRestart: () => void,
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

            for (const hiddenText of scene.hiddenText ?? []) {
                if (!discoveries.includes(hiddenText.id)) continue;
                const discoveredText = this.createTextElement();
                discoveredText.classList.add("story-discovery");
                element.append(discoveredText);
                textRequests.push({
                    target: discoveredText,
                    text: hiddenText.text,
                    position: scene.position ?? "Left",
                });
            }

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
            if (scene.choices.length === 0 && !scene.gameOver) {
                const note = document.createElement("p");
                note.textContent = "This is the end of the story content migrated so far.";
                sceneChoices.navigation.append(note);
            }
            element.append(sceneChoices.navigation);

            if (scene.gameOver) {
                const restartButton = document.createElement("button");
                restartButton.type = "button";
                restartButton.className = "story-restart";
                restartButton.textContent = "Start a new game";
                restartButton.addEventListener("click", onRestart, { once: true });
                element.append(restartButton);
            }

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

}
