import type {
    ActiveCombat,
    CombatCell,
    CombatEncounterDefinition,
    CombatPhase,
    CombatResult,
    CombatSide,
    CombatUnit,
    GridPosition,
} from "../../types";

const PLAYER_ID = "player";
const MAX_GRID_SIZE = 8;

export class CombatEngine {
    public createCombat(encounter: CombatEncounterDefinition, playerHealth = encounter.player.health): ActiveCombat {
        validateEncounter(encounter);
        if (!validPositiveNumber(playerHealth)) throw new RangeError("Player health must be greater than zero when combat starts.");
        const seed = encounter.map.randomizeSeed
            ? Math.floor(Math.random() * 0x7fffffff) + 1
            : encounter.map.seed ?? 1;
        const random = createRandom(seed);
        const units: CombatUnit[] = [{
            id: PLAYER_ID,
            name: "You",
            side: "player",
            health: Math.min(playerHealth, encounter.player.health),
            actions: encounter.player.actions,
            damage: encounter.player.damage,
            position: { x: 0, y: Math.floor(encounter.map.height / 2) },
            actionsRemaining: 0,
        }];

        for (const ally of encounter.allies ?? []) {
            const position = ally.position ?? choosePosition(
                encounter.map.width,
                encounter.map.height,
                units,
                random,
                (candidate) => candidate.x <= Math.floor((encounter.map.width - 1) / 2),
            );
            units.push(createUnit(ally, "player", position));
        }
        for (const enemy of encounter.enemies) {
            const position = enemy.position ?? choosePosition(
                encounter.map.width,
                encounter.map.height,
                units,
                random,
                (candidate) => candidate.x >= Math.ceil(encounter.map.width / 2),
            );
            units.push(createUnit(enemy, enemy.side, position));
        }
        assertUniqueUnitPositions(units, encounter.map.width, encounter.map.height);

        const cells = createTerrain(encounter, units, random);
        return {
            encounterId: encounter.id,
            seed: random.seed,
            width: encounter.map.width,
            height: encounter.map.height,
            cells,
            units,
            playerActions: encounter.player.actions,
            playerActionsRemaining: encounter.player.actions,
            phase: "player",
            movingCellInterval: encounter.map.movingCellInterval ?? 3,
            actionsSinceTerrainMove: 0,
        };
    }

    public move(combat: ActiveCombat, unitId: string, destination: GridPosition): ActiveCombat {
        const next = copyCombat(combat);
        const unit = this.requirePlayerUnit(next, unitId);
        if (!isAdjacent(unit.position, destination)) throw new Error("Move one neighboring tile at a time.");
        if (!isInBounds(next, destination) || isBlocked(next, destination, unit.id)) {
            throw new Error("That tile is not available.");
        }
        if (cutsDiagonalCorner(next, unit.position, destination)) {
            throw new Error("Units cannot move diagonally between blocked tiles.");
        }

        unit.position = { ...destination };
        this.spendPlayerAction(next);
        return this.checkResult(next);
    }

    public attack(combat: ActiveCombat, unitId: string, targetId: string): ActiveCombat {
        const next = copyCombat(combat);
        const attacker = this.requirePlayerUnit(next, unitId);
        const target = next.units.find((unit) => unit.id === targetId && unit.health > 0);
        if (!target || target.side === "player") throw new Error("Select a living hostile target.");
        if (!isAdjacent(attacker.position, target.position)) throw new Error("Basic attacks require an adjacent target.");

        target.health = Math.max(0, target.health - attacker.damage);
        this.spendPlayerAction(next);
        return this.checkResult(next);
    }

    public interact(combat: ActiveCombat, unitId: string, position: GridPosition): ActiveCombat {
        const next = copyCombat(combat);
        const unit = this.requirePlayerUnit(next, unitId);
        const wall = next.cells.find((cell) => cell.kind === "wall" && samePosition(cell, position));
        if (!wall || !isAdjacent(unit.position, wall)) throw new Error("Choose a movable wall next to your unit.");

        const destination = {
            x: wall.x + Math.sign(wall.x - unit.position.x),
            y: wall.y + Math.sign(wall.y - unit.position.y),
        };
        if (!isInBounds(next, destination) || isBlocked(next, destination, unit.id, wall)) {
            throw new Error("There is no room to push the wall that way.");
        }
        wall.x = destination.x;
        wall.y = destination.y;
        this.spendPlayerAction(next);
        return this.checkResult(next);
    }

    public endPlayerTurn(combat: ActiveCombat): ActiveCombat {
        const next = copyCombat(combat);
        if (next.result) return next;
        if (next.phase !== "player") throw new Error("It is not the player team's turn.");

        while (next.playerActionsRemaining > 0 && !next.result) {
            const allies = next.units.filter((unit) => unit.side === "player" && unit.id !== PLAYER_ID && unit.health > 0);
            if (allies.length === 0) break;
            const ally = allies[(next.playerActions - next.playerActionsRemaining) % allies.length]!;
            this.performAiAction(next, ally);
            next.playerActionsRemaining -= 1;
            this.advanceTerrain(next);
            this.checkResult(next);
        }

        if (next.result) return next;
        next.playerActionsRemaining = 0;
        this.runTurnSequence(next);
        return this.checkResult(next);
    }

    public retreat(combat: ActiveCombat): ActiveCombat {
        const next = copyCombat(combat);
        this.requirePlayerUnit(next, PLAYER_ID);
        next.playerActionsRemaining -= 1;
        next.result = "retreat";
        return next;
    }

    private requirePlayerUnit(combat: ActiveCombat, unitId: string): CombatUnit {
        if (combat.result || combat.phase !== "player") throw new Error("The player team cannot act right now.");
        const unit = combat.units.find((candidate) => candidate.id === unitId && candidate.side === "player" && candidate.health > 0);
        if (!unit) throw new Error("That player unit is not available.");
        if (combat.playerActionsRemaining < 1) throw new Error("The team has no actions remaining.");
        return unit;
    }

    private spendPlayerAction(combat: ActiveCombat): void {
        combat.playerActionsRemaining -= 1;
        this.advanceTerrain(combat);
        this.checkResult(combat);
        if (combat.playerActionsRemaining === 0 && !combat.result) this.runTurnSequence(combat);
    }

    private runTurnSequence(combat: ActiveCombat): void {
        this.runOpponentPhases(combat, "enemy");
        if (!combat.result) this.runOpponentPhases(combat, "neutral");
        if (!combat.result) {
            combat.phase = "player";
            combat.playerActionsRemaining = combat.playerActions;
        }
    }

    private runOpponentPhases(combat: ActiveCombat, side: Exclude<CombatSide, "player">): void {
        combat.phase = side;
        const units = combat.units.filter((unit) => unit.side === side && unit.health > 0);
        for (const unit of units) {
            for (let action = 0; action < unit.actions && !combat.result; action += 1) {
                this.performAiAction(combat, unit);
                this.advanceTerrain(combat);
                this.checkResult(combat);
            }
        }
    }

    private performAiAction(combat: ActiveCombat, actor: CombatUnit): void {
        const targets = combat.units.filter((unit) => unit.health > 0
            && (actor.side === "neutral"
                ? unit.side !== "neutral"
                : actor.side === "enemy"
                    ? unit.side === "player"
                    : unit.side !== "player"));
        if (targets.length === 0) return;
        const target = targets.sort((left, right) => distance(actor.position, left.position) - distance(actor.position, right.position))[0]!;
        if (isAdjacent(actor.position, target.position)) {
            target.health = Math.max(0, target.health - actor.damage);
            return;
        }

        const destinations = neighbors(actor.position)
            .filter((position) => isInBounds(combat, position)
                && !isBlocked(combat, position, actor.id)
                && !cutsDiagonalCorner(combat, actor.position, position))
            .sort((left, right) =>
                distance(left, target.position) - distance(right, target.position)
                || left.y - right.y
                || left.x - right.x);
        if (destinations.length > 0 && distance(destinations[0]!, target.position) < distance(actor.position, target.position)) {
            actor.position = destinations[0]!;
        }
    }

    private advanceTerrain(combat: ActiveCombat): void {
        combat.actionsSinceTerrainMove += 1;
        const movingCells = combat.cells.filter((cell) => cell.kind === "moving");
        if (!movingCells.length || combat.actionsSinceTerrainMove < combat.movingCellInterval) return;
        combat.actionsSinceTerrainMove = 0;
        const random = createRandom(combat.seed);
        for (const cell of movingCells) {
            const openCells: GridPosition[] = [];
            for (let y = 0; y < combat.height; y += 1) {
                for (let x = 0; x < combat.width; x += 1) {
                    const position = { x, y };
                    if (!isBlocked(combat, position, undefined, cell)
                        && !combat.units.some((unit) => unit.health > 0 && samePosition(unit.position, position))) {
                        openCells.push(position);
                    }
                }
            }
            if (openCells.length > 0) {
                const destination = openCells[Math.floor(random.next() * openCells.length)]!;
                cell.x = destination.x;
                cell.y = destination.y;
            }
        }
        combat.seed = random.seed;
    }

    private checkResult(combat: ActiveCombat): ActiveCombat {
        if (combat.result) return combat;
        const playerAlive = combat.units.some((unit) => unit.id === PLAYER_ID && unit.health > 0);
        if (!playerAlive) combat.result = "defeat";
        else if (!combat.units.some((unit) => unit.side !== "player" && unit.health > 0)) combat.result = "victory";
        return combat;
    }
}

function createUnit(
    definition: CombatEncounterDefinition["enemies"][number],
    side: CombatSide,
    position: GridPosition,
): CombatUnit {
    return { ...definition, side, position: { ...position }, actionsRemaining: 0 };
}

function createTerrain(encounter: CombatEncounterDefinition, units: readonly CombatUnit[], random: SeededRandom): CombatCell[] {
    const cells: CombatCell[] = [];
    const counts: readonly [CombatCell["kind"], number][] = [
        ["wall", encounter.map.movableWalls ?? 0],
        ["hazard", encounter.map.hazards ?? 0],
        ["moving", encounter.map.movingCells ?? 0],
    ];
    for (const [kind, count] of counts) {
        for (let index = 0; index < count; index += 1) {
            const candidates: GridPosition[] = [];
            for (let y = 0; y < encounter.map.height; y += 1) {
                for (let x = 0; x < encounter.map.width; x += 1) {
                    const position = { x, y };
                    if (units.some((unit) => samePosition(unit.position, position))
                        || cells.some((cell) => samePosition(cell, position))) continue;
                    candidates.push(position);
                }
            }
            if (candidates.length === 0) throw new Error(`Encounter "${encounter.id}" has no free map cells for terrain.`);
            const position = candidates[Math.floor(random.next() * candidates.length)]!;
            cells.push({ ...position, kind });
        }
    }
    return cells;
}

function validateEncounter(encounter: CombatEncounterDefinition): void {
    if (!encounter.id.trim() || !encounter.title.trim()) throw new Error("A combat encounter must have an id and title.");
    const { width, height } = encounter.map;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 3 || height < 3 || width > MAX_GRID_SIZE || height > MAX_GRID_SIZE) {
        throw new RangeError(`Encounter "${encounter.id}" map dimensions must be between 3 and ${MAX_GRID_SIZE}.`);
    }
    if (!Number.isInteger(encounter.player.actions) || encounter.player.actions < 1
        || !validPositiveNumber(encounter.player.health) || !validPositiveNumber(encounter.player.damage)) {
        throw new RangeError(`Encounter "${encounter.id}" has invalid player combat stats.`);
    }
    if (encounter.map.seed !== undefined && (!Number.isInteger(encounter.map.seed) || encounter.map.seed < 0)
        || !Number.isInteger(encounter.map.movingCellInterval ?? 3)
        || (encounter.map.movingCellInterval ?? 3) < 1) {
        throw new RangeError(`Encounter "${encounter.id}" has an invalid map seed or moving-cell interval.`);
    }
    const units = [...(encounter.allies ?? []), ...encounter.enemies];
    if (encounter.enemies.length === 0) throw new Error(`Encounter "${encounter.id}" must define at least one enemy.`);
    const ids = new Set<string>([PLAYER_ID]);
    for (const [index, unit] of units.entries()) {
        if (!unit.id.trim() || ids.has(unit.id)) throw new Error(`Encounter "${encounter.id}" has a missing or duplicate unit id.`);
        ids.add(unit.id);
        if (index < (encounter.allies?.length ?? 0) && unit.side !== "player") {
            throw new Error(`Ally "${unit.id}" must use the player side.`);
        }
        if (index >= (encounter.allies?.length ?? 0) && unit.side === "player") {
            throw new Error(`Enemy "${unit.id}" must use the enemy or neutral side.`);
        }
        if (!validPositiveNumber(unit.health) || !validPositiveNumber(unit.damage)
            || !Number.isInteger(unit.actions) || unit.actions < 1) {
            throw new RangeError(`Combat unit "${unit.id}" has invalid combat stats.`);
        }
    }
    for (const [kind, count] of Object.entries({
        movableWalls: encounter.map.movableWalls ?? 0,
        hazards: encounter.map.hazards ?? 0,
        movingCells: encounter.map.movingCells ?? 0,
    })) {
        if (!Number.isInteger(count) || count < 0 || count > width * height) {
            throw new RangeError(`Encounter "${encounter.id}" has an invalid ${kind} count.`);
        }
    }
}

function assertUniqueUnitPositions(units: readonly CombatUnit[], width: number, height: number): void {
    const positions = new Set<string>();
    for (const unit of units) {
        if (!Number.isInteger(unit.position.x) || !Number.isInteger(unit.position.y)
            || unit.position.x < 0 || unit.position.y < 0 || unit.position.x >= width || unit.position.y >= height) {
            throw new RangeError(`Combat unit "${unit.id}" starts outside the map.`);
        }
        const key = positionKey(unit.position);
        if (positions.has(key)) throw new Error(`Multiple combat units start at ${key}.`);
        positions.add(key);
    }
}

function choosePosition(
    width: number,
    height: number,
    occupiedUnits: readonly CombatUnit[],
    random: SeededRandom,
    preferred: (position: GridPosition) => boolean,
): GridPosition {
    const preferredCandidates: GridPosition[] = [];
    const allCandidates: GridPosition[] = [];
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const position = { x, y };
            if (occupiedUnits.some((unit) => samePosition(unit.position, position))) continue;
            allCandidates.push(position);
            if (preferred(position)) preferredCandidates.push(position);
        }
    }
    const candidates = preferredCandidates.length > 0 ? preferredCandidates : allCandidates;
    if (candidates.length === 0) throw new Error("The generated map has no available starting tile for a unit.");
    return { ...candidates[Math.floor(random.next() * candidates.length)]! };
}

function isBlocked(combat: ActiveCombat, position: GridPosition, ignoreUnitId?: string, ignoreCell?: CombatCell): boolean {
    return combat.cells.some((cell) => cell !== ignoreCell
        && cell.kind !== "hazard"
        && samePosition(cell, position))
        || combat.units.some((unit) => unit.id !== ignoreUnitId && unit.health > 0 && samePosition(unit.position, position));
}

function cutsDiagonalCorner(combat: ActiveCombat, from: GridPosition, to: GridPosition): boolean {
    if (from.x === to.x || from.y === to.y) return false;
    return isBlocked(combat, { x: to.x, y: from.y }) || isBlocked(combat, { x: from.x, y: to.y });
}

function neighbors(position: GridPosition): GridPosition[] {
    const result: GridPosition[] = [];
    for (let y = position.y - 1; y <= position.y + 1; y += 1) {
        for (let x = position.x - 1; x <= position.x + 1; x += 1) {
            if (x !== position.x || y !== position.y) result.push({ x, y });
        }
    }
    return result;
}

function isAdjacent(left: GridPosition, right: GridPosition): boolean {
    return Math.max(Math.abs(left.x - right.x), Math.abs(left.y - right.y)) === 1;
}

function distance(left: GridPosition, right: GridPosition): number {
    return Math.max(Math.abs(left.x - right.x), Math.abs(left.y - right.y));
}

function isInBounds(combat: ActiveCombat, position: GridPosition): boolean {
    return position.x >= 0 && position.y >= 0 && position.x < combat.width && position.y < combat.height;
}

function samePosition(left: GridPosition, right: GridPosition): boolean {
    return left.x === right.x && left.y === right.y;
}

function positionKey(position: GridPosition): string {
    return `${position.x},${position.y}`;
}

function copyCombat(combat: ActiveCombat): ActiveCombat {
    return {
        ...combat,
        cells: combat.cells.map((cell) => ({ ...cell })),
        units: combat.units.map((unit) => ({ ...unit, position: { ...unit.position } })),
    };
}

function validPositiveNumber(value: number): boolean {
    return Number.isFinite(value) && value > 0;
}

interface SeededRandom {
    seed: number;
    next: () => number;
}

function createRandom(seed: number): SeededRandom {
    let currentSeed = seed >>> 0;
    return {
        get seed() {
            return currentSeed;
        },
        next() {
            currentSeed = (currentSeed + 0x6d2b79f5) >>> 0;
            let value = currentSeed;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        },
    };
}
