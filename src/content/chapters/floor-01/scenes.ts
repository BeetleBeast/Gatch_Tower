import type { SceneId, StoryScene } from "../../../types/index";

export const floor01Scenes: Readonly<Record<SceneId, StoryScene>> = {
    "1_0": {
        id: "1_0",
        title: "Cave Exploration",
        text: "As you wander through the cave's labyrinth-like passages, you encounter a variety of pathways, each offering its own unique allure. One path is adorned with vibrant green moss, another lined with glittering crystals, while another disappears into shadowed depths. Further along, you find yourself following the course of an underground stream, and eventually, you stumble upon a cavern illuminated by bioluminescent fungi. Each pathway beckons with its own mysteries, inviting you to explore deeper into the heart of the cave's secrets.",
        choices: [
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
            { id: "followMoss", label: "Follow the moss deeper into the passage", destination: { type: "scene", sceneId: "1_6" } },
        ],
    },
    "1_2": {
        id: "1_2",
        title: "Cave Exploration",
        text: "In this area, the walls sparkle with the mesmerizing glow of crystals, illuminating the surroundings with a soft, ethereal light. The air feels charged with energy, and the ground beneath your feet shimmers with crystalline formations. Every step echoes softly in the cavernous space, creating a sense of wonder and awe.",
        choices: [
            { id: "previous", label: "Previously", destination: { type: "back" } },
            { id: "return", label: "Return to the branching passage", destination: { type: "scene", sceneId: "1_0" } },
            {
                id: "studyCrystals",
                label: "Study the crystal markings",
                destination: { type: "None" },
                condition: {
                    type: "allOf",
                    conditions: [
                        { type: "statusAtLeast", status: "mana", amount: 10 },
                        { type: "statusBelow", status: "comprehension", amount: 1 },
                    ],
                },
                effects: [
                    { type: "applyStatus", status: "mana", amount: -10 },
                    { type: "applyStatus", status: "comprehension", amount: 1 },
                ],
            },
            {
                id: "resonate",
                label: "Resonate with the crystal passage",
                destination: { type: "scene", sceneId: "1_10" },
                condition: {
                    type: "allOf",
                    conditions: [
                        { type: "statusAtLeast", status: "mana", amount: 20 },
                        { type: "statusAtLeast", status: "comprehension", amount: 1 },
                    ],
                },
                effects: [{ type: "applyStatus", status: "mana", amount: -20 }],
            },
        ],
        contentNotice: "Study the markings to gain comprehension. Resonating with the passage requires at least 20 Mana and 1 Comprehension.",
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
            { id: "returnToStream", label: "Return to the underground stream", destination: { type: "scene", sceneId: "1_4" } },
        ],
    },
    "1_6": {
        id: "1_6",
        title: "Cave Exploration",
        sidebarTitle: "The Singing Flower",
        text: "As you traverse the mossy passage, you stumble upon a hidden alcove where a delicate flower blooms amidst the verdant foliage. Its petals shimmer with an otherworldly glow, emitting a faint, melodic hum. The flower seems to beckon to you, offering a sense of peace and serenity amidst the chaos of the cave.",
        position: "Left",
        hiddenText: [
            { id: "moss-figure", text: "Beneath the moss, a pale figure is etched into the stone, pointing toward the still pool." },
        ],
        choices: [
            { id: "leave", label: "Leave the area undisturbed", destination: { type: "scene", sceneId: "1_1" } },
            {
                id: "listen",
                label: "Listen to the soothing melody",
                destination: { type: "scene", sceneId: "1_1" },
                effects: [
                    { type: "applyEffect", effectId: "flower-pacified", kind: "debuff", target: "Pacified", magnitude: 20, durationChoices: 1 },
                    { type: "applyEffect", effectId: "flower-confusion", kind: "debuff", target: "Confusion", magnitude: 20, durationChoices: 1 },
                ],
            },
            { id: "rest", label: "Rest and recover", destination: { type: "None" }, effects: [{ type: "applyStatus", status: "mana", amount: 20 }] },
            {
                id: "feelMoss",
                label: "Feel the texture of the moss",
                destination: { type: "None" },
                condition: { type: "discovery", discoveryId: "moss-figure", discovered: false },
                effects: [
                    { type: "discover", discoveryId: "moss-figure" },
                    { type: "applyStatus", status: "comprehension", amount: 1 },
                ],
            },
            { id: "continue", label: "Continue exploring the passage", destination: { type: "scene", sceneId: "1_7" } },
            { id: "investigate", label: "Investigate the hidden alcove", destination: { type: "scene", sceneId: "1_12" } },
        ],
    },
    "1_7": {
        id: "1_7",
        title: "The Ambiguous Pool",
        text: "The passage opens beside a still underground pool, its surface glazed with shifting colors that do not belong to any light above. A narrow shelf of stone runs along the edge. Something pale moves beneath the water, then vanishes before you can make out its shape.",
        deathSceneId: "1_8",
        choices: [
            {
                id: "followFigure",
                label: "Follow the figure's direction along the shelf",
                destination: { type: "scene", sceneId: "1_9" },
                condition: {
                    type: "allOf",
                    conditions: [
                        { type: "discovery", discoveryId: "moss-figure", discovered: true },
                        { type: "statusAtLeast", status: "comprehension", amount: 1 },
                    ],
                },
            },
            {
                id: "enterPool",
                label: "Step into the pool",
                destination: { type: "death" },
                condition: { type: "discovery", discoveryId: "moss-figure", discovered: false },
                effects: [{ type: "applyStatus", status: "health", amount: -15 }],
            },
        ],
    },
    "1_8": {
        id: "1_8",
        title: "Lost Beneath the Pool",
        sidebarTitle: "Game Over",
        text: "The strange water closes over you. The shifting colors vanish, and the cave falls silent.",
        choices: [],
        gameOver: true,
    },
    "1_9": {
        id: "1_9",
        title: "The Pale Figure",
        text: "The shelf leads to a dry hollow beyond the pool. The pale figure waits there, no longer a carving but a faint silhouette in the stone. It gestures toward the stream and fades, leaving a clear path behind.",
        choices: [
            { id: "followStream", label: "Follow the stream toward its source", destination: { type: "scene", sceneId: "1_10" } },
            { id: "returnToPool", label: "Return to the pool", destination: { type: "scene", sceneId: "1_7" } },
        ],
    },
    "1_10": {
        id: "1_10",
        title: "The Crystal Spring",
        text: "The stream rises from a seam in the cavern wall, where clear water wells up around a cluster of pale crystals. Here the air is calm, and the water carries a faint warmth from somewhere deeper in the rock.",
        choices: [
            { id: "returnToStream", label: "Follow the stream back", destination: { type: "scene", sceneId: "1_4" } },
            { id: "returnToCrystals", label: "Return to the crystal passage", destination: { type: "scene", sceneId: "1_2" } },
        ],
    },
    "1_12": {
        id: "1_12",
        title: "The Hidden Alcove",
        sidebarTitle: "The Hidden Alcove",
        text: "Behind the flower, the moss parts around a seam in the rock. A faint warmth escapes through it, carrying the scent of rain on distant soil. The opening is too narrow to see what lies beyond.",
        hiddenText: [
            { id: "alcove-glyph", text: "The marks resolve into the same pale figure. Its hand points toward a narrow shelf beside the pool." },
        ],
        choices: [
            {
                id: "inspectGlyph",
                label: "Trace the hidden marks",
                destination: { type: "None" },
                condition: { type: "discovery", discoveryId: "alcove-glyph", discovered: false },
                effects: [
                    { type: "discover", discoveryId: "alcove-glyph" },
                    { type: "discover", discoveryId: "moss-figure" },
                    { type: "applyStatus", status: "comprehension", amount: 1 },
                ],
            },
            {
                id: "pool",
                label: "Follow the marks toward the pool",
                destination: { type: "scene", sceneId: "1_7" },
                condition: { type: "discovery", discoveryId: "moss-figure", discovered: true },
            },
            { id: "return", label: "Return to the flower", destination: { type: "scene", sceneId: "1_6" } },
        ],
    },
};
