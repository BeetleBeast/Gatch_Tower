import { describe, expect, it, vi } from "vitest";
import type { TextRendererPort } from "../src/interfaces/index";
import { StoryView } from "../src/ui/storyView";
import type { StoryScene } from "../src/types/index";

describe("StoryView", () => {
    it("forwards scene-specific animation options to the text renderer", () => {
        const textRenderer: TextRendererPort = {
            render: vi.fn(async () => undefined),
            skip: vi.fn(),
        };
        const root = document.createElement("main");
        const view = new StoryView(root, textRenderer);
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

        view.render(scene, vi.fn());

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
        const root = document.createElement("main");
        const view = new StoryView(root, textRenderer);
        const scene: StoryScene = {
            id: "0_2",
            title: "Eye color",
            text: "Choose an eye color.",
            choices: [
                { id: "blue", label: "Piercing blue", destination: { type: "next" } },
                { id: "previous", label: "Previously", destination: { type: "back" } },
            ],
        };

        view.render(scene, vi.fn());

        const buttons = root.querySelectorAll("button");
        expect(buttons[0]?.dataset.choiceId).toBe("blue");
        expect(buttons[0]?.style.color).toBe("rgb(114, 167, 255)");
        expect(buttons[1]?.dataset.choiceId).toBe("previous");
        expect(buttons[1]?.style.color).toBe("");
    });

    it("shows an authored notice when the next story content has not been migrated", () => {
        const textRenderer: TextRendererPort = {
            render: vi.fn(async () => undefined),
            skip: vi.fn(),
        };
        const root = document.createElement("main");
        const view = new StoryView(root, textRenderer);
        const scene: StoryScene = {
            id: "1_1",
            title: "Mossy Passage",
            text: "The passage is quiet.",
            choices: [{ id: "previous", label: "Previously", destination: { type: "back" } }],
            contentNotice: "Further content needs features not migrated yet.",
        };

        view.render(scene, vi.fn());

        expect(root.querySelector('[role="note"]')?.textContent)
            .toBe("Further content needs features not migrated yet.");
    });
});
