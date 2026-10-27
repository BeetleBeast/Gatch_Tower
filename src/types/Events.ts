import type { SceneId, StoryChoice, TextColoringOptions, TextPosition } from ".";

export type Event = {
    name: EventName;
    id: number;

    text: string;
    position?: TextPosition;
    coloring?: TextColoringOptions;
    
    weight: number;

    choices: StoryChoice[];

    allowed_scenes: StoryLocation;

    allowMultipleEvent: boolean;
    includeOriginalScene: boolean;
};


export type EventName  = 'Teleportation' | 'Test' | 'NoEvent'; // here are the names

export type SceneLocations = {
    except?: number[];
} & (
    | { smallerThan: number; biggerThan?: number }
    | { biggerThan: number; smallerThan?: number }
) | 'All' | 'None';



type ChapterLocation = SceneLocations;

export type StoryLocationDetails = {
    chapter: ChapterLocation;
    scene: SceneLocations;
} 

type StoryLocation = StoryLocationDetails | 'All' | 'None' | SceneId;
