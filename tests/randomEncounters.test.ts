import { describe, expect, it } from "vitest";
import { ALL_EVENTS } from "../src/content/Events";
import { RandomEncounters } from "../src/domain/encounters/randomEncounters";
import type { Event } from "../src/types/Events";

describe("RandomEncounters", () => {
    it("selects only events allowed at the current scene", () => {
        const encounters = new RandomEncounters(ALL_EVENTS, () => 0.1);

        expect(encounters.tryRandomEncounter("2_0")).toBeNull();
    });

    it("uses configured weights and returns a single-only event alone", () => {
        const encounters = new RandomEncounters(ALL_EVENTS, () => 0.1);

        expect(encounters.tryRandomEncounter("0_0")).toEqual([ALL_EVENTS[0]]);
    });

    it("can select two events only when both allow multiple events", () => {
        const events = [createEvent(10, true), createEvent(11, true)];
        const rolls = [0.1, 0.2];
        const encounters = new RandomEncounters(events, () => rolls.shift() ?? 0);

        expect(encounters.tryRandomEncounter("0_0")?.map((event) => event.id)).toEqual([10, 11]);
    });

    it("returns null when the weighted roll lands on the no-event remainder", () => {
        const events = [createEvent(10, true)];
        const encounters = new RandomEncounters(events, () => 0.9);

        expect(encounters.tryRandomEncounter("0_0")).toBeNull();
    });
});

function createEvent(id: number, allowMultipleEvent: boolean): Event {
    return {
        id,
        name: "Test",
        text: "Test event",
        weight: 0.4,
        choices: [],
        allowed_scenes: "All",
        allowMultipleEvent,
        includeOriginalScene: true,
    };
}
