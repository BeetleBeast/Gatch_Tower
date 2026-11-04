import type { ActiveEffect, StoryScene } from "../../types";
import { DEFAULT_GAME_STATUSES, GAME_INFLUENCE_STATUSES } from "../../constants";
import { STORY_CHOICE_COLORS } from "../story/storyChoiceList";

export interface SidebarRenderOptions {
    scene: StoryScene;
    statuses: Readonly<Record<string, number>>;
    manaUnlocked: boolean;
    characterChoices: Readonly<Record<string, string>>;
    effects: Readonly<Record<string, ActiveEffect>>;
    discoveries: readonly string[];
    isDead: boolean;
}

export class SidebarView {
    private readonly root: HTMLElement;
    private readonly title: HTMLElement;
    private readonly content: HTMLElement;
    private readonly collapseButton: HTMLButtonElement;
    private readonly discoveryDetails: ReadonlyMap<string, { title: string; text: string }>;
    private readonly characterChoiceLabels: ReadonlyMap<string, string>;
    private readonly characterChoiceColors: ReadonlyMap<string, string>;
    private collapsed = false;

    constructor(root: HTMLElement, scenes: readonly StoryScene[]) {
        this.root = root;
        this.discoveryDetails = new Map(
            scenes.flatMap((scene) => (scene.hiddenText ?? []).map((discovery) => [
                discovery.id,
                { title: scene.sidebarTitle ?? scene.title, text: discovery.text },
            ] as const)),
        );
        this.characterChoiceLabels = new Map(
            scenes.flatMap((scene) => scene.choices.flatMap((choice) =>
                (choice.effects ?? []).flatMap((effect) => effect.type === "setCharacterChoice"
                    ? Object.entries(effect.record).map(([key, value]) => [`${key}:${value}`, choice.label] as const)
                    : []),
            )),
        );
        this.characterChoiceColors = new Map(
            scenes.flatMap((scene) => scene.choices.flatMap((choice) =>
                (choice.effects ?? []).flatMap((effect) => effect.type === "setCharacterChoice"
                    ? Object.entries(effect.record).flatMap(([key, value]) => {
                        const color = STORY_CHOICE_COLORS[choice.id];
                        return color ? [[`${key}:${value}`, color] as const] : [];
                    })
                    : []),
            )),
        );

        const header = document.createElement("header");
        header.className = "sidebar-header";
        this.title = document.createElement("h2");
        this.title.className = "sidebar-title";
        this.title.textContent = "Gacha Tower";
        this.collapseButton = document.createElement("button");
        this.collapseButton.type = "button";
        this.collapseButton.className = "sidebar-toggle";
        this.collapseButton.addEventListener("click", () => this.setCollapsed(!this.collapsed));
        header.append(this.title, this.collapseButton);

        this.content = document.createElement("div");
        this.content.className = "sidebar-content";
        root.classList.add("game-sidebar");
        root.setAttribute("aria-label", "Game sidebar");
        root.append(header, this.content);
        this.setCollapsed(false);
    }

    public render(options: SidebarRenderOptions): void {
        this.content.replaceChildren();

        if (options.isDead) {
            const deathNote = document.createElement("p");
            deathNote.className = "sidebar-death";
            deathNote.textContent = "You have fallen.";
            this.content.append(deathNote);
        }

        this.content.append(this.createStatuses(options.statuses, options.manaUnlocked));
        this.content.append(this.createCharacter(options.characterChoices));
        this.content.append(this.createEffects(options.effects));
        const influences = this.createInfluences(options.statuses);
        if (influences) this.content.append(influences);
        this.content.append(this.createDiscoveries(options.discoveries));
        this.content.append(this.createActions());
    }

    private createStatuses(statuses: Readonly<Record<string, number>>, manaUnlocked: boolean): HTMLElement {
        const section = this.createSection("Current status");
        const list = document.createElement("ul");
        list.className = "sidebar-status-list";

        for (const [id, value] of Object.entries(statuses)) {
            if (GAME_INFLUENCE_STATUSES.some((influence) => influence.id === id)) continue;
            if (value === 0 && id !== "health" && !(id === "mana" && manaUnlocked)) continue;
            const item = document.createElement("li");
            item.className = "sidebar-status";
            item.dataset.status = id;
            const label = this.createLabel(id);
            const valueElement = document.createElement("span");
            valueElement.className = "sidebar-status-value";
            valueElement.textContent = id === "health" || id === "mana" ? `${value} / 100` : String(value);
            item.append(label, valueElement);

            if (id === "health" || id === "mana") {
                const meter = document.createElement("progress");
                meter.className = `sidebar-meter sidebar-meter--${id}`;
                meter.max = 100;
                meter.value = value;
                meter.setAttribute("aria-label", `${this.createLabel(id)}: ${value} of 100`);
                item.append(meter);
            }

            list.append(item);
        }

        section.append(list);
        return section;
    }

    private createCharacter(characterChoices: Readonly<Record<string, string>>): HTMLElement {
        const section = this.createSection("Character");
        const description = this.createCharacterDescription(characterChoices);
        if (!description) {
            const note = document.createElement("p");
            note.className = "sidebar-empty";
            note.textContent = "Your reflection is still forming in the cave's dim light.";
            section.append(note);
            return section;
        }

        const paragraph = document.createElement("p");
        paragraph.className = "sidebar-character-description";
        const segments = description.split(/(\{[a-z]+\})/gu);
        for (const segment of segments) {
            const key = /^\{([a-z]+)\}$/u.exec(segment)?.[1];
            if (!key) {
                paragraph.append(document.createTextNode(segment));
                continue;
            }

            const value = characterChoices[key];
            if (!value) continue;
            const highlighted = document.createElement("span");
            highlighted.className = "sidebar-character-trait";
            highlighted.dataset.attribute = key;
            highlighted.textContent = this.characterChoiceLabels.get(`${key}:${value}`) ?? this.createLabel(value);
            const color = this.characterChoiceColors.get(`${key}:${value}`);
            if (color) highlighted.style.color = color;
            paragraph.append(highlighted);
        }
        section.append(paragraph);
        return section;
    }

    private createInfluences(statuses: Readonly<Record<string, number>>): HTMLElement | null {
        const section = this.createSection("Influences");
        const list = document.createElement("ul");
        list.className = "sidebar-influence-list";

        for (const influence of GAME_INFLUENCE_STATUSES) {
            const value = Math.max(0, Math.min(100, statuses[influence.id] ?? DEFAULT_GAME_STATUSES[influence.id] ?? 0));
            if (value === 0) continue;
            const item = document.createElement("li");
            item.className = "sidebar-influence";
            item.dataset.influence = influence.id;

            const label = document.createElement("span");
            label.textContent = influence.label;
            const valueElement = document.createElement("span");
            valueElement.className = "sidebar-influence-value";
            valueElement.textContent = `${value}%`;

            const meter = document.createElement("progress");
            meter.className = "sidebar-influence-meter";
            meter.max = 100;
            meter.value = value;
            meter.setAttribute("aria-label", `${influence.label}: ${value} of 100`);
            meter.style.accentColor = getInfluenceColor(value, influence.id === "control");
            item.append(label, valueElement, meter);
            list.append(item);
        }

        if (list.childElementCount === 0) return null;
        section.append(list);
        return section;
    }

    private createActions(): HTMLElement {
        const actions = document.createElement("nav");
        actions.className = "sidebar-actions";
        actions.setAttribute("aria-label", "Sidebar actions");

        for (const label of ["Settings", "Saves", "Info"]) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "sidebar-action";
            button.dataset.sidebarAction = label.toLowerCase();
            button.textContent = label;
            button.title = "Coming soon";
            button.disabled = true;
            actions.append(button);
        }

        return actions;
    }

    private createCharacterDescription(characterChoices: Readonly<Record<string, string>>): string | null {
        const traits = ["eyes", "hair", "skin", "stature", "attire"]
            .filter((key) => characterChoices[key] !== undefined);
        if (traits.length === 0 && !characterChoices.gender) return null;

        const phrases: Readonly<Record<string, string>> = {
            eyes: "your {eyes} eyes",
            hair: "your {hair} stylish hair",
            skin: "your {skin} complexion",
            stature: "your {stature} stature",
            attire: "your {attire} attire",
        };
        const selectedPhrases = traits.map((key) => phrases[key] ?? `your {${key}} ${key}`);
        let description: string;

        if (traits.length === 1 && traits[0] === "eyes") {
            description = "Your {eyes} eyes reveal a captivating depth, while the rest of your features remain undisclosed, shrouded in mystery.";
        } else if (traits.length === 2 && traits[0] === "eyes") {
            description = `Your {eyes} eyes and ${selectedPhrases[1]} reveal a captivating essence, yet the remainder of you remains veiled in mystery.`;
        } else if (traits.length === 3 && traits[0] === "eyes") {
            description = `Your {eyes} eyes, ${selectedPhrases[1]}, and ${selectedPhrases[2]} exude a captivating essence, leaving the rest of you shrouded in mystery.`;
        } else if (traits.length === 4 && traits[0] === "eyes") {
            description = `Your {eyes} eyes, ${selectedPhrases[1]}, ${selectedPhrases[2]}, and ${selectedPhrases[3]} combine to present a captivating essence, yet the remainder of you remains shrouded in mystery.`;
        } else if (traits.length === 5 && traits[0] === "eyes") {
            description = `Your {eyes} eyes, ${selectedPhrases[1]}, ${selectedPhrases[2]}, ${selectedPhrases[3]}, and ${selectedPhrases[4]} collectively emanate a captivating essence, leaving the rest of you unexplored.`;
        } else {
            const introduction = selectedPhrases.map((phrase) => phrase?.replace(/^your /u, "")).join(", ");
            description = introduction
                ? `Your appearance is coming into focus: ${introduction}.`
                : "";
        }

        const gender = characterChoices.gender;
        if (gender) {
            const pronoun = description.endsWith(".") ? " " : "";
            description += `${pronoun}While your gender is {gender}, your race remains a mystery, awaiting discovery.`;
        }
        return description;
    }

    private createEffects(effects: Readonly<Record<string, ActiveEffect>>): HTMLElement {
        const section = this.createSection("Active effects");
        const list = document.createElement("ul");
        list.className = "sidebar-effects-list";
        const entries = Object.entries(effects);

        if (entries.length === 0) {
            list.append(this.createEmptyNote("No active effects."));
        } else {
            for (const [id, effect] of entries) {
                const item = document.createElement("li");
                item.dataset.effectKind = effect.kind;
                const change = effect.kind === "buff" ? "+" : "-";
                const duration = effect.remainingChoices === null
                    ? "Permanent"
                    : `${effect.remainingChoices} choice${effect.remainingChoices === 1 ? "" : "s"}`;
                item.textContent = `${id}: ${change}${effect.magnitude} ${this.createLabel(effect.target)} (${duration})`;
                list.append(item);
            }
        }

        section.append(list);
        return section;
    }

    private createDiscoveries(discoveries: readonly string[]): HTMLElement {
        const section = this.createSection("Discoveries");
        const list = document.createElement("ul");
        list.className = "sidebar-discoveries-list";

        if (discoveries.length === 0) {
            list.append(this.createEmptyNote("No clues found."));
        } else {
            for (const id of discoveries) {
                const item = document.createElement("li");
                const detail = this.discoveryDetails.get(id);
                if (!detail) {
                    item.textContent = this.createLabel(id);
                } else {
                    const disclosure = document.createElement("details");
                    const summary = document.createElement("summary");
                    summary.textContent = detail.title;
                    const text = document.createElement("p");
                    text.textContent = detail.text;
                    disclosure.append(summary, text);
                    item.append(disclosure);
                }
                list.append(item);
            }
        }

        section.append(list);
        return section;
    }

    private createSection(title: string): HTMLElement {
        const section = document.createElement("section");
        section.className = "sidebar-section";
        const heading = document.createElement("h3");
        heading.textContent = title;
        section.append(heading);
        return section;
    }

    private createEmptyNote(text: string): HTMLLIElement {
        const note = document.createElement("li");
        note.className = "sidebar-empty";
        note.textContent = text;
        return note;
    }

    private createLabel(value: string): string {
        return value.replace(/[-_]/gu, " ").replace(/\b\w/gu, (letter) => letter.toUpperCase());
    }

    private setCollapsed(collapsed: boolean): void {
        this.collapsed = collapsed;
        this.root.dataset.collapsed = String(collapsed);
        this.collapseButton.textContent = collapsed ? "›" : "‹";
        this.collapseButton.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
        this.collapseButton.setAttribute("aria-expanded", String(!collapsed));
        this.root.parentElement?.classList.toggle("is-sidebar-collapsed", collapsed);
    }
}

function getInfluenceColor(value: number, inverted: boolean): string {
    const hue = Math.round(inverted ? value * 1.2 : (100 - value) * 1.2);
    return `hsl(${hue} 85% 45%)`;
}
