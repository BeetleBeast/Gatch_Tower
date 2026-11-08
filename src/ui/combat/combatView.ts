import type { ActiveCombat, CombatEncounterDefinition } from "../../types";
import type { CombatViewActions } from "../../interfaces";

type CombatActionMode = "move" | "attack" | "interact";

export class CombatView {
    private readonly root: HTMLElement;

    constructor(root: HTMLElement) {
        this.root = root;
    }

    public render(encounter: CombatEncounterDefinition, combat: ActiveCombat, actions: CombatViewActions): void {
        const content = document.createElement("section");
        content.className = "combat-screen";
        const title = document.createElement("h1");
        title.textContent = encounter.title;
        const description = document.createElement("p");
        description.textContent = encounter.description;
        const counter = document.createElement("p");
        counter.className = "combat-counter";
        counter.setAttribute("role", "status");
        counter.textContent = combat.result
            ? `Combat ${combat.result}.`
            : combat.phase === "player"
                ? `Your team's actions: ${combat.playerActionsRemaining} / ${combat.playerActions}`
                : `${combat.phase === "enemy" ? "Enemy" : "Neutral"} phase`;
        content.append(title, description, counter);

        const unitList = document.createElement("div");
        unitList.className = "combat-units";
        unitList.setAttribute("aria-label", "Your units");
        const livingPlayerUnits = combat.units.filter((unit) => unit.side === "player" && unit.health > 0);
        for (const [index, unit] of livingPlayerUnits.entries()) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "combat-unit-select";
            button.dataset.unitId = unit.id;
            button.textContent = `${unit.name} (${unit.health} HP)`;
            button.setAttribute("aria-pressed", String(index === 0));
            button.addEventListener("click", () => {
                unitList.querySelectorAll("button").forEach((candidate) => {
                    candidate.setAttribute("aria-pressed", String(candidate === button));
                });
                selectedUnitId = unit.id;
            });
            unitList.append(button);
        }
        content.append(unitList);

        let selectedUnitId = livingPlayerUnits[0]?.id ?? "player";
        let mode: CombatActionMode = "move";
        const controls = document.createElement("div");
        controls.className = "combat-controls";
        const setMode = (nextMode: CombatActionMode) => {
            mode = nextMode;
            controls.querySelectorAll<HTMLButtonElement>("[data-combat-mode]").forEach((button) => {
                button.setAttribute("aria-pressed", String(button.dataset.combatMode === mode));
            });
        };
        for (const [actionMode, label] of [
            ["move", "Move"],
            ["attack", "Attack"],
            ["interact", "Interact / push"],
        ] as const) {
            const button = document.createElement("button");
            button.type = "button";
            button.dataset.combatMode = actionMode;
            button.textContent = label;
            button.setAttribute("aria-pressed", String(actionMode === mode));
            button.disabled = combat.phase !== "player" || combat.playerActionsRemaining <= 0 || Boolean(combat.result);
            button.addEventListener("click", () => setMode(actionMode));
            controls.append(button);
        }
        const endTurn = document.createElement("button");
        endTurn.type = "button";
        endTurn.textContent = "End team turn (allies act automatically)";
        endTurn.disabled = combat.phase !== "player" || Boolean(combat.result);
        endTurn.addEventListener("click", actions.onEndTurn);
        controls.append(endTurn);

        const retreat = document.createElement("button");
        retreat.type = "button";
        retreat.textContent = "Retreat (1 action)";
        retreat.disabled = combat.phase !== "player" || combat.playerActionsRemaining < 1 || Boolean(combat.result);
        retreat.addEventListener("click", actions.onRetreat);
        controls.append(retreat);
        content.append(controls);

        const board = document.createElement("div");
        board.className = "combat-grid";
        board.style.gridTemplateColumns = `repeat(${combat.width}, minmax(2.5rem, 1fr))`;
        board.setAttribute("role", "grid");
        board.setAttribute("aria-label", `${combat.width} by ${combat.height} battlefield`);
        const errors = document.createElement("p");
        errors.className = "combat-error";
        errors.setAttribute("role", "alert");

        for (let y = 0; y < combat.height; y += 1) {
            for (let x = 0; x < combat.width; x += 1) {
                const position = { x, y };
                const unit = combat.units.find((candidate) => candidate.health > 0
                    && candidate.position.x === x && candidate.position.y === y);
                const terrain = combat.cells.find((cell) => cell.x === x && cell.y === y);
                const cell = document.createElement("button");
                cell.type = "button";
                cell.className = `combat-cell${terrain ? ` combat-cell--${terrain.kind}` : ""}${unit ? ` combat-cell--${unit.side}` : ""}`;
                cell.setAttribute("role", "gridcell");
                cell.setAttribute("aria-label", describeCell(x, y, terrain?.kind, unit?.name));
                cell.textContent = unit
                    ? unit.id === "player" ? "You" : unit.name.slice(0, 3)
                    : terrain ? terrain.kind === "wall" ? "Wall" : terrain.kind === "hazard" ? "Hazard" : "Moving"
                        : "";
                if (unit) cell.title = `${unit.name}: ${unit.health} HP`;
                cell.disabled = Boolean(combat.result) || combat.phase !== "player" || combat.playerActionsRemaining <= 0;
                cell.addEventListener("click", () => {
                    try {
                        if (mode === "move") actions.onMove(selectedUnitId, position);
                        else if (mode === "attack") {
                            if (!unit) throw new Error("Choose a tile occupied by a living enemy.");
                            actions.onAttack(selectedUnitId, unit.id);
                        } else actions.onInteract(selectedUnitId, position);
                    } catch (error) {
                        errors.textContent = error instanceof Error ? error.message : String(error);
                    }
                });
                board.append(cell);
            }
        }
        content.append(board, errors);

        const roster = document.createElement("ul");
        roster.className = "combat-roster";
        for (const unit of combat.units) {
            const item = document.createElement("li");
            item.textContent = `${unit.name} — ${unit.health} HP, ${unit.actions} actions per turn`
                + `${unit.health === 0 ? " (defeated)" : ""}`;
            roster.append(item);
        }
        content.append(roster);
        this.root.replaceChildren(content);
    }
}

function describeCell(x: number, y: number, terrain: string | undefined, unitName: string | undefined): string {
    const contents = [unitName, terrain].filter(Boolean).join(", ");
    return `Row ${y + 1}, column ${x + 1}${contents ? `: ${contents}` : ""}`;
}
