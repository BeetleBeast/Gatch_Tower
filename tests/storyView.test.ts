import { describe, expect, it, vi } from "vitest";
import type { StoryViewRenderOptions, TextRendererPort } from "../src/interfaces/index";
import type { QteViewPort } from "../src/interfaces/index";
import { StoryView } from "../src/ui/storyView";
import type { Event, StoryScene } from "../src/types/index";

describe("StoryView", () => {
    it("forwards scene-specific animation options to the text renderer", () => {
        const textRenderer: TextRendererPort = {
            render: vi.fn(async () => undefined),
            skip: vi.fn(),
        };
        const qteView: QteViewPort = { play: vi.fn(async () => createQteResult()) };
        const root = document.createElement("main");
        const view = new StoryView(root, textRenderer, qteView);
        const scene: StoryScene = {
            id: "0_0",
            title: "Opening",
            text: "A quiet beginning.",
            position: "Centered",
            textOptions: {
                effect: "typewriter",
                timeSettings: { delayPerChar: 8 },
            },
            choices: [],
        };

        view.render(scene, createRenderOptions());

        expect(root.querySelector("h1")?.className).toBe("Quest_Title");
        expect(textRenderer.render).toHaveBeenCalledWith(expect.objectContaining({
            text: scene.text,
            position: "Centered",
            options: scene.textOptions,
        }));
    });

    it("colors choice buttons for known color ids and leaves navigation buttons unchanged", () => {
        const textRenderer: TextRendererPort = {
            render: vi.fn(async () => undefined),
            skip: vi.fn(),
        };
        const qteView: QteViewPort = { play: vi.fn(async () => createQteResult()) };
        const root = document.createElement("main");
        const view = new StoryView(root, textRenderer, qteView);
        const scene: StoryScene = {
            id: "0_2",
            title: "Eye color",
            text: "Choose an eye color.",
            choices: [
                { id: "blue", label: "Piercing blue", destination: { type: "next" } },
                { id: "previous", label: "Previously", destination: { type: "back" } },
            ],
        };

        view.render(scene, createRenderOptions());

        const buttons = root.querySelectorAll("button");
        expect(buttons[0]?.dataset.choiceId).toBe("blue");
        expect(buttons[0]?.textContent).toBe("(1) Piercing blue");
        expect(buttons[0]?.classList.contains("story-choice")).toBe(true);
        expect(buttons[0]?.classList.contains("startscreen")).toBe(false);
        expect(buttons[0]?.style.color).toBe("rgb(114, 167, 255)");
        expect(buttons[1]?.dataset.choiceId).toBe("previous");
        expect(buttons[1]?.textContent).toBe("(2) Previously");
        expect(buttons[1]?.classList.contains("story-choice--back")).toBe(true);
        expect(buttons[1]?.style.color).toBe("");
    });

    it("shows an authored notice when the next story content has not been migrated", () => {
        const textRenderer: TextRendererPort = {
            render: vi.fn(async () => undefined),
            skip: vi.fn(),
        };
        const qteView: QteViewPort = { play: vi.fn(async () => createQteResult()) };
        const root = document.createElement("main");
        const view = new StoryView(root, textRenderer, qteView);
        const scene: StoryScene = {
            id: "1_1",
            title: "Mossy Passage",
            text: "The passage is quiet.",
            choices: [{ id: "previous", label: "Previously", destination: { type: "back" } }],
            contentNotice: "Further content needs features not migrated yet.",
        };

        view.render(scene, createRenderOptions());

        expect(root.querySelector('[role="note"]')?.textContent)
            .toBe("Further content needs features not migrated yet.");
    });

    it("locks choices until the QTE completes, then reports its result", async () => {
        const textRenderer: TextRendererPort = {
            render: vi.fn(async () => undefined),
            skip: vi.fn(),
        };
        const result = createQteResult();
        const qteView: QteViewPort = { play: vi.fn(async () => result) };
        const root = document.createElement("main");
        const view = new StoryView(root, textRenderer, qteView);
        const onQteResult = vi.fn();
        const scene: StoryScene = {
            id: "1_3",
            title: "Danger",
            text: "A shape moves in the dark.",
            choices: [{ id: "continue", label: "Continue", destination: { type: "next" } }],
            qte: { amount: 1, durationMs: 2000, countdownSeconds: 0, input: "Space" },
        };

        view.render(scene, createRenderOptions({ onQteResult }));

        const choice = root.querySelector<HTMLButtonElement>(".story-choice");
        expect(choice?.disabled).toBe(true);
        await Promise.resolve();

        expect(choice?.disabled).toBe(false);
        expect(onQteResult).toHaveBeenCalledWith(result);
        expect(root.querySelector(".qte-summary")?.textContent).toContain("2 points");
    });

    it("displays active buffs and debuffs with their remaining duration", () => {
        const textRenderer: TextRendererPort = {
            render: vi.fn(async () => undefined),
            skip: vi.fn(),
        };
        const qteView: QteViewPort = { play: vi.fn(async () => createQteResult()) };
        const root = document.createElement("main");
        const view = new StoryView(root, textRenderer, qteView);
        const scene: StoryScene = {
            id: "0_1",
            title: "Crossroads",
            text: "Choose a path.",
            choices: [],
        };

        view.render(scene, createRenderOptions({ activeEffects: {
            focusBoost: { kind: "buff", target: "focus", magnitude: 2, remainingChoices: 3 },
            fatigue: { kind: "debuff", target: "speed", magnitude: 1, remainingChoices: null },
        } }));

        const effects = root.querySelectorAll<HTMLLIElement>(".active-effects li");
        expect(effects).toHaveLength(2);
        expect(effects[0]?.textContent).toContain("+2; 3 choices remaining");
        expect(effects[1]?.textContent).toContain("-1; Permanent");
        expect(effects[0]?.dataset.effectKind).toBe("buff");
        expect(effects[1]?.dataset.effectKind).toBe("debuff");
    });

    it("shows a random event with the story and routes its own choice", () => {
        const textRenderer: TextRendererPort = {
            render: vi.fn(async () => undefined),
            skip: vi.fn(),
        };
        const qteView: QteViewPort = { play: vi.fn(async () => createQteResult()) };
        const root = document.createElement("main");
        const view = new StoryView(root, textRenderer, qteView);
        const event = createEvent(true);
        const onEventChoice = vi.fn();
        const scene: StoryScene = {
            id: "0_0",
            title: "Opening",
            text: "The story continues.",
            choices: [{ id: "continue", label: "Continue", destination: { type: "next" } }],
        };

        view.render(scene, createRenderOptions({ events: [event], onEventChoice }));

        expect(root.querySelector("h1")?.textContent).toBe("Opening");
        expect(root.querySelector(".random-event__title")?.textContent).toBe("Teleportation");
        expect(textRenderer.render).toHaveBeenCalledWith(expect.objectContaining({
            text: "The story continues.",
        }));
        expect(textRenderer.render).toHaveBeenCalledWith(expect.objectContaining({
            text: "A dev offers you a ride.",
        }));
        expect(root.querySelectorAll(".story-choice")).toHaveLength(2);
        root.querySelector<HTMLButtonElement>("[data-event-choice-id='accept']")?.click();
        expect(onEventChoice).toHaveBeenCalledWith(event, event.choices[0]);
    });

    it("renders only the random event when it excludes the original scene", () => {
        const textRenderer: TextRendererPort = {
            render: vi.fn(async () => undefined),
            skip: vi.fn(),
        };
        const qteView: QteViewPort = { play: vi.fn(async () => createQteResult()) };
        const root = document.createElement("main");
        const view = new StoryView(root, textRenderer, qteView);
        const event = createEvent(false);
        const scene: StoryScene = {
            id: "0_0",
            title: "Original scene must be hidden",
            text: "Original text must be hidden.",
            choices: [{ id: "continue", label: "Original choice", destination: { type: "next" } }],
        };

        view.render(scene, createRenderOptions({ events: [event] }));

        expect(root.querySelector("h1")).toBeNull();
        expect(root.textContent).not.toContain("Original scene must be hidden");
        expect(root.textContent).not.toContain("Original text must be hidden");
        expect(root.textContent).not.toContain("Original choice");
        expect(root.querySelector(".random-event__title")?.textContent).toBe("Teleportation");
    });
});

function createRenderOptions(overrides: Partial<StoryViewRenderOptions> = {}): StoryViewRenderOptions {
    return {
        events: [],
        activeEffects: {},
        onChoice: vi.fn(),
        onEventChoice: vi.fn(),
        onQteResult: vi.fn(),
        ...overrides,
    };
}

function createEvent(includeOriginalScene: boolean): Event {
    return {
        id: 1,
        name: "Teleportation",
        text: "A dev offers you a ride.",
        weight: 1,
        choices: [{ id: "accept", label: "Accept", destination: { type: "scene", sceneId: "2_0" } }],
        allowed_scenes: "All",
        allowMultipleEvent: true,
        includeOriginalScene,
    };
}

function createQteResult() {
    return { result: "perfect" as const, score: 2, perfectCount: 1, successCount: 0, failCount: 0 };
}
