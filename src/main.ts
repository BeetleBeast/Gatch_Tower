import { StartGame } from "./app/startGame";
import { LocalSaveRepository } from "./infrastructure/persistence/localSaveRepository";
import { StoryEngine } from "./domain/story/storyEngine";
import { NewGameFactory } from "./domain/save/newGameFactory";
import { storyScenes } from "./content/scenes";
import { StartScreen } from "./ui/startScreen";
import { StoryView } from "./ui/storyView";
import { StoryTextRenderer } from "./ui/textRenderer";
import { AnimationClock } from "./infrastructure/browser/animationClock";
import { FadeEffect } from "./ui/textRenderer/effects/fadeEffect";
import { TypewriterEffect } from "./ui/textRenderer/effects/typewriterEffect";
import { ScrambleEffect } from "./ui/textRenderer/effects/scrambleEffect";
import { TextAnimator } from "./ui/textRenderer/textAnimator";
import { QteSequence } from "./domain/qte/qteSequence";
import { BarQteView } from "./ui/qte/barQteView";
import { RandomEncounters } from "./domain/encounters/randomEncounters";

function bootstrap(): void {
    const appRoot = document.querySelector<HTMLElement>(".app");
    if (!appRoot) throw new Error("Could not start the game: the .app element is missing.");

    const animationClock = new AnimationClock();
    const textAnimator = new TextAnimator({
        typewriter: new TypewriterEffect(animationClock),
        fade: new FadeEffect(animationClock),
        scramble: new ScrambleEffect(animationClock),
    });
    const textRenderer = new StoryTextRenderer(textAnimator);
    const qteSequence = new QteSequence(animationClock);
    const game = new StartGame(
        new StartScreen(appRoot),
        new StoryView(appRoot, textRenderer, new BarQteView(qteSequence)),
        new LocalSaveRepository(window.localStorage),
        new NewGameFactory("0_0"),
        new StoryEngine(storyScenes),
        new RandomEncounters()
    );

    game.start();
}

document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
