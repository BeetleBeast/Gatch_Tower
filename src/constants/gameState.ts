export const DEFAULT_GAME_STATUSES: Readonly<Record<string, number>> = {
    health: 100,
    mana: 0,
    comprehension: 0,
    pain: 0,
    fatigue: 0,
    fear: 0,
    stress: 0,
    trauma: 0,
    addiction: 0,
    sickness: 0,
    bleed: 0,
    control: 70,
};

export const STATUS_LIMITS: Readonly<Record<string, { min: number; max?: number }>> = {
    health: { min: 0, max: 100 },
    mana: { min: 0, max: 100 },
    comprehension: { min: 0 },
    pain: { min: 0, max: 100 },
    fatigue: { min: 0, max: 100 },
    fear: { min: 0, max: 100 },
    stress: { min: 0, max: 100 },
    trauma: { min: 0, max: 100 },
    addiction: { min: 0, max: 100 },
    sickness: { min: 0, max: 100 },
    bleed: { min: 0, max: 100 },
    control: { min: 0, max: 100 },
};

export const GAME_INFLUENCE_STATUSES = [
    { id: "pain", label: "Pain" },
    { id: "fatigue", label: "Fatigue" },
    { id: "fear", label: "Fear" },
    { id: "stress", label: "Stress" },
    { id: "trauma", label: "Trauma" },
    { id: "addiction", label: "Addiction" },
    { id: "sickness", label: "Sickness" },
    { id: "bleed", label: "Bleed" },
    { id: "control", label: "Control", inverted: true },
] as const;
