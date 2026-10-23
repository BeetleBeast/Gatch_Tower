import type { SceneId, StoryScene } from "../types/index";
import { floor00Scenes } from "./chapters/floor-00/scenes";
import { floor01Scenes } from "./chapters/floor-01/scenes";

export const storyScenes: Readonly<Record<SceneId, StoryScene>> = {
    ...floor00Scenes,
    ...floor01Scenes,
};
