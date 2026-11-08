import type { Event } from "../types";

export const ALL_EVENTS: Event[] = [
    {
        name: "Test",
        id: 0,
        text: "A dev has captured you and is about to question you!\nWhat will you do?",
        position: "Left",
        coloring: {
            Color: "blue",
            duration: 1,
            Background: "transparent",
            OnlySnippet: false,
        },
        weight: 0.5,
        choices: [
            { id: "1", label: "Run", destination: { type: "None" } },
            { id: "2", label: "Fight", destination: { type: "None" } },
            { id: "3", label: "Talk", destination: { type: "None" } },
        ],
        allowed_scenes: {
            chapter: { smallerThan: 2 },
            scene: "All",
        },
        allowMultipleEvent: false,
        includeOriginalScene: true,
    },
    {
        name: "Teleportation",
        id: 1,
        text: "A dev offers you a ride to the worlds edge!\nWhat will you do?",
        position: "Left",
        coloring: {
            Color: "yellow",
            duration: 1,
            Background: "transparent",
            OnlySnippet: false,
        },
        weight: 1,
        choices: [
            { id: "1", label: "Accept", destination: { type: "None" } },
        ],
        allowed_scenes: "None",
        allowMultipleEvent: true,
        includeOriginalScene: true,
    },
];
