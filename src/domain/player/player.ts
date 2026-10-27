export type Race = "Human" | "Ork" | "Elf";
export type Gender = "Male" | "Female";
export type Profession = "Warrior" | "Mage" | "Rogue";
export type PlayerAttribute = "Strength" | "Intelligence" | "Charisma" | "Agility" | "Luck";

export interface PlayerAttributes {
    Strength: number;
    Intelligence: number;
    Charisma: number;
    Agility: number;
    Luck: number;
}

export interface PlayerConfig {
    name: string;
    race: Race;
    gender: Gender;
    age: number;
    profession: Profession;
    attributes: PlayerAttributes;
    level?: number;
    maxHealth?: number;
    health?: number;
}

export class Player {
    public readonly name: string;
    public readonly race: Race;
    public readonly gender: Gender;
    public readonly age: number;
    public readonly profession: Profession;

    private currentLevel: number;
    private currentHealth: number;
    private readonly maximumHealth: number;
    private readonly playerAttributes: PlayerAttributes;
    private readonly debuffs: Record<string, number> = {};

    constructor(config: PlayerConfig) {
        validateNonNegativeInteger(config.age, "age");
        const level = config.level ?? 1;
        const maxHealth = config.maxHealth ?? 100;
        validateNonNegativeInteger(level, "level");
        validatePositiveNumber(maxHealth, "maxHealth");
        for (const [attribute, value] of Object.entries(config.attributes)) {
            validateNonNegativeNumber(value, attribute);
        }

        const health = config.health ?? maxHealth;
        validateNonNegativeNumber(health, "health");
        if (health > maxHealth) throw new RangeError("health cannot exceed maxHealth.");

        this.name = config.name;
        this.race = config.race;
        this.gender = config.gender;
        this.age = config.age;
        this.profession = config.profession;
        this.currentLevel = level;
        this.maximumHealth = maxHealth;
        this.currentHealth = health;
        this.playerAttributes = { ...config.attributes };
    }

    public get level(): number {
        return this.currentLevel;
    }

    public get health(): number {
        return this.currentHealth;
    }

    public get maxHealth(): number {
        return this.maximumHealth;
    }

    public get attributes(): Readonly<PlayerAttributes> {
        return this.playerAttributes;
    }

    public get debuffEffects(): Readonly<Record<string, number>> {
        return { ...this.debuffs };
    }

    public get isAlive(): boolean {
        return this.currentHealth > 0;
    }

    public takeDamage(amount: number): void {
        validateNonNegativeNumber(amount, "amount");
        this.currentHealth = Math.max(0, this.currentHealth - amount);
    }

    public heal(amount?: number): void {
        if (amount === undefined) {
            this.currentHealth = this.maximumHealth;
            return;
        }

        validateNonNegativeNumber(amount, "amount");
        this.currentHealth = Math.min(this.maximumHealth, this.currentHealth + amount);
    }

    public levelUp(amount = 1): void {
        validatePositiveInteger(amount, "amount");
        this.currentLevel += amount;
    }

    public applyDebuff(effect: string, amount: number): void {
        if (effect.trim() === "") throw new TypeError("effect must not be empty.");
        validateNonNegativeNumber(amount, "amount");
        this.debuffs[effect] = Math.min(100, (this.debuffs[effect] ?? 0) + amount);
    }

    public removeDebuff(effect: string): void {
        delete this.debuffs[effect];
    }

    public resurrect(): void {
        this.currentHealth = this.maximumHealth;
    }

    public rested(amount: number, recoverableEffects: readonly string[] = ["2", "3", "9", "10", "20", "21"]): void {
        validateNonNegativeNumber(amount, "amount");
        for (const effect of recoverableEffects) {
            const remaining = (this.debuffs[effect] ?? 0) - amount;
            if (remaining <= 0) delete this.debuffs[effect];
            else this.debuffs[effect] = remaining;
        }
    }
}

function validateNonNegativeNumber(value: number, name: string): void {
    if (!Number.isFinite(value) || value < 0) {
        throw new RangeError(`${name} must be a finite non-negative number.`);
    }
}

function validatePositiveNumber(value: number, name: string): void {
    if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError(`${name} must be a finite positive number.`);
    }
}

function validateNonNegativeInteger(value: number, name: string): void {
    if (!Number.isInteger(value) || value < 0) {
        throw new RangeError(`${name} must be a non-negative integer.`);
    }
}

function validatePositiveInteger(value: number, name: string): void {
    if (!Number.isInteger(value) || value <= 0) {
        throw new RangeError(`${name} must be a positive integer.`);
    }
}
