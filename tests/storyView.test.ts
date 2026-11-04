import { describe, expect, it, vi } from "vitest";
import type { StoryViewRenderOptions, TextRendererPort } from "../src/interfaces/index";
import type { QteViewPort } from "../src/interfaces/index";
import { StoryView } from "../src/ui/story/storyView";
import { SidebarView } from "../src/ui/sidebar/sidebarView";
import type { Event, StoryScene } from "../src/types/index";
import { storyScenes } from "../src/content/scenes";

describe("StoryView", () => {
    it("keeps the sidebar collapsed when its scene data is refreshed", () => {
        const sidebarRoot = document.createElement("aside");
        const sidebar = new SidebarView(sidebarRoot, []);
        const firstScene: StoryScene = { id: "1_1", title: "Moss", text: "Moss.", choices: [] };
        const nextScene: StoryScene = { id: "1_2", title: "Crystals", text: "Crystals.", choices: [] };
        const options = createRenderOptions();

        sidebar.render({
            scene: firstScene,
            statuses: options.statuses,
            manaUnlocked: options.manaUnlocked,
            characterChoices: options.characterChoices,
            effects: options.activeEffects,
            discoveries: options.discoveries,
            isDead: false,
        });
        sidebarRoot.querySelector<HTMLButtonElement>(".sidebar-toggle")?.click();
        sidebar.render({
            scene: nextScene,
            statuses: options.statuses,
            manaUnlocked: options.manaUnlocked,
            characterChoices: options.characterChoices,
            effects: options.activeEffects,
            discoveries: options.discoveries,
            isDead: false,
        });

        expect(sidebarRoot.dataset.collapsed).toBe("true");
        expect(sidebarRoot.querySelector(".sidebar-toggle")?.getAttribute("aria-expanded")).toBe("false");
        expect(sidebarRoot.querySelector(".sidebar-title")?.textContent).toBe("Gacha Tower");
    });

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

    it("displays status, effects, and discoveries in the persistent sidebar", () => {
        const textRenderer: TextRendererPort = {
            render: vi.fn(async () => undefined),
            skip: vi.fn(),
        };
        const qteView: QteViewPort = { play: vi.fn(async () => createQteResult()) };
        const root = document.createElement("main");
        const sidebarRoot = document.createElement("aside");
        const scene: StoryScene = {
            id: "0_1",
            title: "Crossroads",
            text: "Choose a path.",
            hiddenText: [{ id: "mark", text: "A clue in the rock." }],
            choices: [{
                id: "grey",
                label: "Intense grey",
                destination: { type: "next" },
                effects: [{ type: "setCharacterChoice", record: { eyes: "lightgrey" } }],
            }],
        };
        const sidebar = new SidebarView(sidebarRoot, [scene]);
        const view = new StoryView(root, textRenderer, qteView, sidebar);

        view.render(scene, createRenderOptions({ activeEffects: {
            focusBoost: { kind: "buff", target: "focus", magnitude: 2, remainingChoices: 3 },
            fatigue: { kind: "debuff", target: "speed", magnitude: 1, remainingChoices: null },
        }, statuses: { health: 75, mana: 40, comprehension: 1 }, characterChoices: { eyes: "lightgrey" }, discoveries: ["mark"] }));

        expect(sidebarRoot.querySelector("[data-status='health']")?.textContent).toContain("75 / 100");
        const effects = sidebarRoot.querySelectorAll<HTMLLIElement>(".sidebar-effects-list li");
        expect(effects).toHaveLength(2);
        expect(effects[0]?.textContent).toContain("+2 Focus (3 choices)");
        expect(effects[1]?.textContent).toContain("-1 Speed (Permanent)");
        expect(effects[0]?.dataset.effectKind).toBe("buff");
        expect(effects[1]?.dataset.effectKind).toBe("debuff");
        expect(sidebarRoot.querySelector(".sidebar-discoveries-list details summary")?.textContent)
            .toBe("Crossroads");
        const characterDescription = sidebarRoot.querySelector(".sidebar-character-description");
        expect(characterDescription?.textContent)
            .toBe("Your Intense grey eyes reveal a captivating depth, while the rest of your features remain undisclosed, shrouded in mystery.");
        expect(characterDescription?.querySelector("[data-attribute='eyes']")?.getAttribute("style")).toContain("color");
    });

    it("renders the legacy influence meters and disabled future sidebar actions", () => {
        const sidebarRoot = document.createElement("aside");
        const sidebar = new SidebarView(sidebarRoot, []);

        sidebar.render({
            scene: { id: "0_0", title: "Opening", text: "Begin.", choices: [] },
            statuses: { pain: 45, fatigue: 12, control: 90 },
            manaUnlocked: false,
            characterChoices: {},
            effects: {},
            discoveries: [],
            isDead: false,
        });

        const pain = sidebarRoot.querySelector<HTMLProgressElement>('[data-influence="pain"] progress');
        const fatigue = sidebarRoot.querySelector<HTMLProgressElement>('[data-influence="fatigue"] progress');
        const control = sidebarRoot.querySelector<HTMLProgressElement>('[data-influence="control"] progress');
        expect(pain?.value).toBe(45);
        expect(pain?.getAttribute("aria-label")).toBe("Pain: 45 of 100");
        expect(fatigue?.value).toBe(12);
        expect(control?.value).toBe(90);
        expect(sidebarRoot.querySelectorAll(".sidebar-influence")).toHaveLength(3);
        expect(sidebarRoot.querySelectorAll<HTMLButtonElement>(".sidebar-action:disabled"))
            .toHaveLength(3);
        expect(sidebarRoot.querySelector('[data-sidebar-action="settings"]')?.textContent).toBe("Settings");
        expect(sidebarRoot.querySelector('[data-sidebar-action="saves"]')?.textContent).toBe("Saves");
        expect(sidebarRoot.querySelector('[data-sidebar-action="info"]')?.textContent).toBe("Info");
    });

    it("hides zero-valued statuses except Health and unlocked Mana", () => {
        const sidebarRoot = document.createElement("aside");
        const sidebar = new SidebarView(sidebarRoot, []);
        const scene: StoryScene = { id: "0_0", title: "Opening", text: "Begin.", choices: [] };
        const options = {
            scene,
            statuses: { health: 0, mana: 0, comprehension: 0, pain: 0, control: 0 },
            manaUnlocked: false,
            characterChoices: {},
            effects: {},
            discoveries: [],
            isDead: false,
        };

        sidebar.render(options);

        expect(sidebarRoot.querySelector("[data-status='health']")).not.toBeNull();
        expect(sidebarRoot.querySelector("[data-status='mana']")).toBeNull();
        expect(sidebarRoot.querySelector("[data-status='comprehension']")).toBeNull();
        expect(sidebarRoot.querySelector("[data-influence='pain']")).toBeNull();
        expect(sidebarRoot.querySelector("[data-influence='control']")).toBeNull();
        expect(Array.from(sidebarRoot.querySelectorAll(".sidebar-section h3"), (heading) => heading.textContent))
            .not.toContain("Influences");

        sidebar.render({ ...options, manaUnlocked: true });

        expect(sidebarRoot.querySelector("[data-status='mana']")?.textContent).toContain("0 / 100");
    });

    it("restores the full legacy-style character portrait as choices are made", () => {
        const sidebarRoot = document.createElement("aside");
        const sidebar = new SidebarView(sidebarRoot, Object.values(storyScenes));

        sidebar.render({
            scene: storyScenes["0_7"]!,
            statuses: {},
            manaUnlocked: false,
            characterChoices: {
                eyes: "lightgrey",
                hair: "lightblue",
                skin: "pink",
                stature: "lightpink",
                attire: "darkgrey",
                gender: "pink",
            },
            effects: {},
            discoveries: [],
            isDead: false,
        });

        expect(sidebarRoot.querySelector(".sidebar-character-description")?.textContent)
            .toBe("Your Intense grey eyes, your cascading waves stylish hair, your Rosy-pink complexion, your Petite and delicate stature, and your Weathered and worn, marked by dirt and grime, reflecting a seasoned traveler attire collectively emanate a captivating essence, leaving the rest of you unexplored. While your gender is Feminine, your race remains a mystery, awaiting discovery.");
        expect(sidebarRoot.querySelector("[data-attribute='hair']")?.getAttribute("style")).toContain("color");
        expect(sidebarRoot.querySelector(".sidebar-title")?.textContent).toBe("Gacha Tower");
    });

    it("shows discovered text and current resources, and offers restart after death", () => {
        const textRenderer: TextRendererPort = {
            render: vi.fn(async () => undefined),
            skip: vi.fn(),
        };
        const qteView: QteViewPort = { play: vi.fn(async () => createQteResult()) };
        const root = document.createElement("main");
        const sidebarRoot = document.createElement("aside");
        const sidebar = new SidebarView(sidebarRoot, []);
        const view = new StoryView(root, textRenderer, qteView, sidebar);
        const onRestart = vi.fn();
        const scene: StoryScene = {
            id: "1_8",
            title: "Lost",
            text: "The end.",
            hiddenText: [{ id: "mark", text: "A clue." }],
            choices: [],
            gameOver: true,
        };

        view.render(scene, createRenderOptions({
            statuses: { health: 0, mana: 40, comprehension: 1 },
            discoveries: ["mark"],
            isDead: true,
            onRestart,
        }));

        expect(sidebarRoot.querySelector("[data-status='health']")?.textContent).toContain("0 / 100");
        expect(sidebarRoot.querySelector(".sidebar-death")?.textContent).toBe("You have fallen.");
        expect(root.querySelector(".story-discovery")).not.toBeNull();
        expect(textRenderer.render).toHaveBeenCalledWith(expect.objectContaining({ text: "A clue." }));
        root.querySelector<HTMLButtonElement>(".story-restart")?.click();
        expect(onRestart).toHaveBeenCalledOnce();
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
        statuses: {},
        manaUnlocked: false,
        characterChoices: {},
        discoveries: [],
        activeEffects: {},
        isDead: false,
        onChoice: vi.fn(),
        onEventChoice: vi.fn(),
        onQteResult: vi.fn(),
        onRestart: vi.fn(),
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
