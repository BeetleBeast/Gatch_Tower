import type { StoryViewPort } from "../interfaces/index";
import type { TextRendererPort } from "../interfaces/index";
import type { StoryScene } from "../types/index";

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

export class StoryView implements StoryViewPort {
    private readonly root: HTMLElement;
    private readonly textRenderer: TextRendererPort;
    private currentTextElement: HTMLElement | null = null;

    constructor(root: HTMLElement, textRenderer: TextRendererPort) {
        this.root = root;
        this.textRenderer = textRenderer;
    }

    public render(scene: StoryScene, onChoice: (choiceId: string) => void): void {
        if (this.currentTextElement) this.textRenderer.skip(this.currentTextElement);

        const content = document.createElement("section");
        content.className = "main";

        const title = document.createElement("h1");
        title.textContent = scene.title;

        const text = document.createElement("p");
        text.className = "TextBlock";
        this.currentTextElement = text;
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

        const choices = document.createElement("nav");
        choices.setAttribute("aria-label", "Story choices");

        for (const choice of scene.choices) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "startscreen";
            button.dataset.choiceId = choice.id;
            const choiceColor = CHOICE_COLORS[choice.id];
            if (choiceColor) button.style.color = choiceColor;
            button.textContent = choice.label;
            button.addEventListener("click", () => onChoice(choice.id), { once: true });
            choices.append(button);
        }

        if (scene.choices.length === 0) {
            const note = document.createElement("p");
            note.textContent = "This is the end of the story content migrated so far.";
            choices.append(note);
        }

        content.append(title, text, choices);
        if (scene.contentNotice) {
            const notice = document.createElement("p");
            notice.className = "story-content-note";
            notice.setAttribute("role", "note");
            notice.textContent = scene.contentNotice;
            content.append(notice);
        }
        this.root.replaceChildren(content);
        void this.textRenderer.render({
            target: text,
            text: scene.text,
            position: scene.position ?? "Left",
            ...(scene.textOptions ? { options: scene.textOptions } : {}),
        }).catch((error: unknown) => {
            this.showError(`Could not render story text: ${String(error)}`);
        });
    }

    public showError(message: string): void {
        let errorElement = this.root.querySelector<HTMLParagraphElement>("[data-story-error]");
        if (!errorElement) {
            errorElement = document.createElement("p");
            errorElement.dataset.storyError = "true";
            errorElement.setAttribute("role", "alert");
            this.root.append(errorElement);
        }

        errorElement.textContent = message;
    }
}
