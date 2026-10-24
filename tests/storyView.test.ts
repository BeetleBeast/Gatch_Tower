import { describe, expect, it, vi } from "vitest";
import type { TextRendererPort } from "../src/interfaces/index";
import type { QteViewPort } from "../src/interfaces/index";
import { StoryView } from "../src/ui/storyView";
import type { StoryScene } from "../src/types/index";

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

        view.render(scene, vi.fn(), vi.fn(), {});

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

        view.render(scene, vi.fn(), vi.fn(), {});

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

        view.render(scene, vi.fn(), vi.fn(), {});

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

        view.render(scene, vi.fn(), onQteResult, {});

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

        view.render(scene, vi.fn(), vi.fn(), {
            focusBoost: { kind: "buff", target: "focus", magnitude: 2, remainingChoices: 3 },
            fatigue: { kind: "debuff", target: "speed", magnitude: 1, remainingChoices: null },
        });

        const effects = root.querySelectorAll<HTMLLIElement>(".active-effects li");
        expect(effects).toHaveLength(2);
        expect(effects[0]?.textContent).toContain("+2; 3 choices remaining");
        expect(effects[1]?.textContent).toContain("-1; Permanent");
        expect(effects[0]?.dataset.effectKind).toBe("buff");
        expect(effects[1]?.dataset.effectKind).toBe("debuff");
    });
});

function createQteResult() {
    return { result: "perfect" as const, score: 2, perfectCount: 1, successCount: 0, failCount: 0 };
}
