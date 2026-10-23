import type { SceneId, StoryScene } from "../../../types/index";

export const floor01Scenes: Readonly<Record<SceneId, StoryScene>> = {
    "1_0": {
        id: "1_0",
        title: "Cave Exploration",
        text: "As you wander through the cave's labyrinth-like passages, you encounter a variety of pathways, each offering its own unique allure. One path is adorned with vibrant green moss, another lined with glittering crystals, while another disappears into shadowed depths. Further along, you find yourself following the course of an underground stream, and eventually, you stumble upon a cavern illuminated by bioluminescent fungi. Each pathway beckons with its own mysteries, inviting you to explore deeper into the heart of the cave's secrets.",
        choices: [
            { id: "previous", label: "Previously", destination: { type: "back" } },
            { id: "mossyPassage", label: "The Mossy Passage", destination: { type: "scene", sceneId: "1_1" } },
            { id: "crystalTunnel", label: "The Crystal Tunnel", destination: { type: "scene", sceneId: "1_2" } },
            { id: "shadowedCorridor", label: "The Shadowed Corridor", destination: { type: "scene", sceneId: "1_3" } },
            { id: "undergroundStream", label: "The Subterranean Stream", destination: { type: "scene", sceneId: "1_4" } },
            { id: "fungalGrove", label: "The Fungal Grove", destination: { type: "scene", sceneId: "1_5" } },
        ],
    },
    "1_1": {
        id: "1_1",
        title: "Cave Exploration",
        text: "The current area is enveloped in a verdant embrace, with lush green moss covering every surface. The air is cool and fresh, carrying the earthy scent of vegetation. Shafts of dim light filter through the canopy above, casting dappled patterns on the moss-covered ground.",
        choices: [
            { id: "previous", label: "Previously", destination: { type: "back" } },
        ],
        contentNotice: "More story content on this path needs features that have not been migrated yet.",
    },
    "1_2": {
        id: "1_2",
        title: "Cave Exploration",
        text: "In this area, the walls sparkle with the mesmerizing glow of crystals, illuminating the surroundings with a soft, ethereal light. The air feels charged with energy, and the ground beneath your feet shimmers with crystalline formations. Every step echoes softly in the cavernous space, creating a sense of wonder and awe.",
        choices: [
            { id: "previous", label: "Previously", destination: { type: "back" } },
        ],
        contentNotice: "More story content on this path needs features that have not been migrated yet.",
    },
    "1_3": {
        id: "1_3",
        title: "Cave Exploration",
        text: "As you navigate this area, darkness presses in from all sides, enveloping you in an oppressive gloom. The air feels heavy and stifling, and the sound of your own footsteps echoes eerily in the silence. Shapes shift and morph in the shadows, playing tricks on your senses and heightening your sense of unease.",
        choices: [
            { id: "previous", label: "Previously", destination: { type: "back" } },
            { id: "continue", label: "Next", destination: { type: "scene", sceneId: "1_4" } },
        ],
    },
    "1_4": {
        id: "1_4",
        title: "Cave Exploration",
        text: "Here, the area is defined by the presence of a crystal-clear stream that meanders through the cavern. The sound of rushing water fills the air, accompanied by the gentle drip of stalactites above. The walls are slick with moisture, and patches of bioluminescent fungi cast a soft, eerie glow on the surroundings.",
        choices: [
            { id: "previous", label: "Previously", destination: { type: "back" } },
            { id: "continue", label: "Next", destination: { type: "scene", sceneId: "1_5" } },
        ],
    },
    "1_5": {
        id: "1_5",
        title: "Cave Exploration",
        text: "In this area, the cavern is alive with the soft glow of bioluminescent fungi, casting an otherworldly light on the surroundings. The air is thick with the earthy scent of mushrooms, and strange shapes loom in the shadows. The ground beneath your feet is spongy with fungal growth, adding to the surreal atmosphere of the grove.",
        choices: [
            { id: "previous", label: "Previously", destination: { type: "back" } },
        ],
        contentNotice: "More story content on this path needs features that have not been migrated yet.",
    },
};
