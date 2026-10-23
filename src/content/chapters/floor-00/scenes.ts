import type { SceneId, StoryScene } from "../../../types/index";

export const floor00Scenes: Readonly<Record<SceneId, StoryScene>> = {
    "0_0": {
        id: "0_0",
        title: "Into the new world",
        text: "You wake up in a dark cave, the damp air clinging to your skin as you grope for any semblance of direction. The sound of distant rumbling echoes through the cavern, urging you to explore. With each step, the path twists and turns, revealing ancient ruins and forgotten passages. As you navigate this mysterious labyrinth, the weight of uncertainty presses upon you, yet a flicker of curiosity ignites within.",
        choices: [
            { id: "continue", label: "Next", destination: { type: 'next' }},
        ],
    },
    "0_1": {
        id: "0_1",
        title: "Into the new world",
        text: "Gazing into the rippling surface of a subterranean pool, you catch a glimpse of your own reflection amidst the murky depths. The dim light barely illuminates your features, leaving much to the imagination. Who is this figure staring back at you? The lines of gender blur in the wavering distortion, leaving only a sense of mystery in its wake...",
        choices: [
            { id: "previous", label: "Previously", destination: { type: 'back' }},
            { id: "continue", label: "Next", destination: { type: "next" }},
        ],
    },
    "0_2": {
        id: "0_2",
        title: "Into the new world",
        text: "In the dim cavern, your eyes glimmer like precious gems, reflecting the faint light with an entrancing allure. With each glance, you discern a depth of color, ranging from the azure depths of a tranquil ocean to the earthy warmth of sunlit forests.",
        choices: [
            { id: "previous", label: "Previously", destination: { type: 'back' }},
            { id: "blue", label: "Piercing blue", destination: { type: "next" }, effects: [
                { type: 'setCharacterChoice', record: { "eyes": "blue" } }
            ]},
            { id: "brown", label: "Deep brown", destination: { type: "next" }, effects: [
                { type: 'setCharacterChoice', record: { "eyes": "brown" } }
            ]},
            { id: "green", label: "Striking green", destination: { type: "next" }, effects: [
                { type: 'setCharacterChoice', record: { "eyes": "green" } }
            ]},
            { id: "hazel", label: "Captivating hazel", destination: { type: "next" }, effects: [
                { type: 'setCharacterChoice', record: { "eyes": "hazel" } }
            ]},
            { id: "grey", label: "Intense grey", destination: { type: "next" }, effects: [
                { type: 'setCharacterChoice', record: { "eyes": "lightgrey" } }
            ]},
        ],
    },
    "0_3": {
        id: "0_3",
        title: "Into the new world",
        text: "Amidst the shadows, your hair dances in the gentle breeze, its texture hinting at a story of its own. Whether cascading in ebony rivers, catching the light in shimmering silver strands, or ablaze with the fiery hues of a setting sun, each tress adds to your mystique.",
        choices: [
            { id: "previous", label: "Previously", destination: { type: 'back' }},
            { id: "lightblue", label: "cascading waves", destination: { type: 'next' }, effects: [
                { type: 'setCharacterChoice', record: { "hair": "lightblue" } }
            ]},
            { id: "darkblue", label: "cropped short", destination: { type: 'next' }, effects: [
                { type: 'setCharacterChoice', record: { "hair": "darkblue" } }
            ]},
            { id: "lightyellow", label: "braided intricately", destination: { type: 'next' }, effects: [
                { type: 'setCharacterChoice', record: { "hair": "lightyellow" } }
            ]},
            { id: "orange", label: "sophisticated bun", destination: { type: 'next' }, effects: [
                { type: 'setCharacterChoice', record: { "hair": "orange" } }
            ]},
            { id: "firebrick", label: "wild and free", destination: { type: 'next' }, effects: [
                { type: 'setCharacterChoice', record: { "hair": "firebrick" } }
            ]},
        ],
    },
    "0_4": {
        id: "0_4",
        title: "Into the new world",
        text: "Your skin, bathed in the flickering light, revealed a complexion that seemed to hold stories untold. As you observe closely, you notice nuances of color, from the palest porcelain to the richest ebony, each hue adding depth to Your enigmatic presence.",
        choices: [
            { id: "previous", label: "Previously", destination: { type: 'back' }},
            { id: "beige", label: "Porcelain fair", destination: { type: 'next' }, effects: [
                { type: 'setCharacterChoice', record: { "skin": "beige" } }
            ]},
            { id: "bronze", label: "Sun-kissed bronze", destination: { type: 'next' }, effects: [
                { type: 'setCharacterChoice', record: { "skin": "bronze" } }
            ]},
            { id: "olive", label: "Olive-toned", destination: { type: 'next' }, effects: [
                { type: 'setCharacterChoice', record: { "skin": "olive" } }
            ]},
            { id: "pink", label: "Rosy-pink", destination: { type: 'next' }, effects: [
                { type: 'setCharacterChoice', record: { "skin": "pink" } }
            ]},
            { id: "lightbrown", label: "Deep ebony", destination: { type: 'next' }, effects: [
                { type: 'setCharacterChoice', record: { "skin": "lightbrown" } }
            ]},
        ]
    },
    "0_5": {
        id: "0_5",
        title: "Into the new world",
        text: "Your stature, silhouetted against the cavern walls, commands attention with a presence that is both formidable and intriguing. As you study them further, you discern the subtle contours of Your frame, which may lean towards a delicate grace or exude a powerful strength, leaving an indelible impression in the depths of the cavern.",
        choices: [
            { id: "previous", label: "Previously", destination: { type: 'back' }},
            { id: "lightpink", label: "Petite and delicate", destination: { type: 'next' }, effects: [
                { type: 'setCharacterChoice', record: { stature: "lightpink" } }
            ]},
            { id: "darkblue", label: "Tall and statuesque", destination: { type: 'next' }, effects: [
                { type: 'setCharacterChoice', record: { stature: "darkblue" } }
            ]},
            { id: "green", label: "Somewhere in between", destination: { type: 'next' }, effects: [
                { type: 'setCharacterChoice', record: { stature: "green" } }
            ]},
            { id: "lightblue", label: "Lean and athletic", destination: { type: 'next' }, effects: [
                { type: 'setCharacterChoice', record: { stature: "lightblue" } }
            ]},
            { id: "brown", label: "Muscular and imposing", destination: { type: 'next' }, effects: [
                { type: 'setCharacterChoice', record: { stature: "brown" } }
            ]},
        ]
    },
    "0_6": {
        id: "0_6",
        title: "Into the new world",
        text: "Your attire, a reflection of your journey through the rugged terrain, appears weathered and worn, bearing the marks of your passage through the cave's unforgiving landscape. You notice that your clothing carries either the rugged authenticity of a seasoned traveler, marked by dirt and grime, or the pristine cleanliness that hints at your recent arrival, untouched by the trials of the cavern.",
        choices: [
            { id: "previous", label: "Previously", destination: { type: "back" } },
            {
                id: "darkgrey",
                label: "Weathered and worn, marked by dirt and grime, reflecting a seasoned traveler",
                destination: { type: "next" },
                effects: [{ type: "setCharacterChoice", record: { attire: "darkgrey" } }],
            },
            {
                id: "lightgrey",
                label: "Pristine and clean, untouched by the trials of the cavern, hinting at a recent arrival",
                destination: { type: "next" },
                effects: [{ type: "setCharacterChoice", record: { attire: "lightgrey" } }],
            },
        ],
    },
    "0_7": {
        id: "0_7",
        title: "Into the new world",
        text: "Gazing into the rippling waters of the cave's puddle, the figure contemplates their gender, recognizing it as a deeply personal truth. Whether they perceive themselves as aligning with the feminine or masculine, their identity crystallizes as a reflection of their inner self, not merely a narrative waiting to be written.",
        choices: [
            { id: "previous", label: "Previously", destination: { type: "back" } },
            {
                id: "pink",
                label: "Feminine",
                destination: { type: "next" },
                effects: [{ type: "setCharacterChoice", record: { gender: "pink" } }],
            },
            {
                id: "blue",
                label: "Masculine",
                destination: { type: "next" },
                effects: [{ type: "setCharacterChoice", record: { gender: "blue" } }],
            },
        ],
    },
    "0_8": {
        id: "0_8",
        title: "Into the new world",
        text: "As the light begins to dim within the cavern, the figure gazes into the fading reflections of the puddle, contemplating their essence. In the obscurity, their species becomes shrouded in uncertainty, a mysterious aspect of their being that defies classification. Their identity transcends the confines of known races, leaving their true nature obscured in the fading light.",
        choices: [
            { id: "continue", label: "Next", destination: { type: "next" } },
        ],
    },
    "0_9": {
        id: "0_9",
        title: "Into the new world",
        text: "Navigating the damp walls of the cavern, you seek an exit, fingers tracing the rough texture in search of escape. With each step, your determination grows, fueled by the desire to break free from the confines of this underground labyrinth.",
        choices: [
            { id: "previous", label: "Previously", destination: { type: "back" } },
            { id: "continue", label: "Next", destination: { type: "scene", sceneId: "1_0" } },
        ],
    },
};
