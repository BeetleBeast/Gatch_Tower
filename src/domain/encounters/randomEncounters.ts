import { ALL_EVENTS } from "../../content/Events";
import type { SceneId, SceneLocations, StoryLocationDetails } from "../../types";
import type { Event } from "../../types";

export class RandomEncounters {
    private readonly events: readonly Event[];
    private readonly random: () => number;

    constructor(events: readonly Event[] = ALL_EVENTS, random: () => number = Math.random) {
        this.events = events;
        this.random = random;
    }

    public tryRandomEncounter(currentSceneId: SceneId): Event[] | null {
        const eligibleEvents = this.getEligibleEvents(currentSceneId);
        const firstEvent = this.roll(eligibleEvents);
        if (!firstEvent) return null;
        if (!firstEvent.allowMultipleEvent) return [firstEvent];

        const secondEvent = this.roll(
            eligibleEvents.filter((event) => event.id !== firstEvent.id && event.allowMultipleEvent),
        );
        return secondEvent ? [firstEvent, secondEvent] : [firstEvent];
    }

    private roll(events: readonly Event[]): Event | null {
        const totalWeight = events.reduce((total, event) => total + event.weight, 0);
        if (totalWeight <= 0) return null;

        const roll = this.random() * Math.max(1, totalWeight);
        let cumulativeWeight = 0;
        for (const event of events) {
            if (event.weight <= 0) continue;
            cumulativeWeight += event.weight;
            if (roll < cumulativeWeight) return event;
        }

        return null;
    }

    private getEligibleEvents(currentSceneId: SceneId): Event[] {
        const [currentChapter, currentScene] = currentSceneId.split("_").map(Number);

        return this.events.filter((event) => {
            const allowedScenes = event.allowed_scenes;

            if (allowedScenes === "All") return true;
            if (allowedScenes === "None") return false;
            if (typeof allowedScenes === "string") return allowedScenes === currentSceneId;

            return this.matchesLocation(allowedScenes, currentChapter!, currentScene!);
        });
    }

    private matchesLocation(
        allowedScenes: StoryLocationDetails,
        currentChapter: number,
        currentScene: number,
    ): boolean {
        return this.matchesSceneLocation(allowedScenes.chapter, currentChapter)
            && this.matchesSceneLocation(allowedScenes.scene, currentScene);
    }

    private matchesSceneLocation(location: SceneLocations, value: number): boolean {
        if (location === "All") return true;
        if (location === "None") return false;
        if (location.except?.includes(value)) return false;
        if (location.biggerThan !== undefined && value <= location.biggerThan) return false;
        if (location.smallerThan !== undefined && value >= location.smallerThan) return false;
        return true;
    }
}
