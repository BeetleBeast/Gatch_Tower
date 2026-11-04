# Refactored TypeScript structure

This is the current guide to the TypeScript implementation in `src/` and its
tests in `tests/`. The root README and root-level JavaScript files describe the
legacy version; they are not the source of truth for this refactor. Update this
guide when files or responsibilities in `src/` or `tests/` change.

## Folder responsibilities

| Folder | Responsibility |
| --- | --- |
| `src/` | Application entry point and the refactored TypeScript game. |
| `src/app/` | Application-level game startup and orchestration. |
| `src/constants/` | Runtime defaults and fixed values; `index.ts` is the public barrel. |
| `src/constants/text/` | Default text-rendering configuration. |
| `src/content/` | Authored game data and content aggregation. |
| `src/content/chapters/` | Story content grouped by chapter/floor. |
| `src/content/chapters/floor-00/`, `floor-01/` | Scene definitions for the corresponding floor. |
| `src/domain/` | Game rules and state transitions, independent of browser rendering. |
| `src/domain/effects/`, `encounters/`, `player/`, `qte/`, `save/`, `story/` | Domain modules grouped by game concept. |
| `src/infrastructure/` | Adapters for browser APIs and persistence. |
| `src/infrastructure/browser/` | Browser-backed timing implementations. |
| `src/infrastructure/persistence/` | Local save storage and migration. |
| `src/interfaces/` | Ports/contracts used to keep domain and application code decoupled from adapters. |
| `src/interfaces/text/` | Text-rendering and animation ports. |
| `src/types/` | Shared data shapes and domain types; runtime constants belong in `src/constants/`. |
| `src/ui/` | DOM views and presentation adapters, grouped by feature. |
| `src/ui/qte/` | Quick-time-event view. |
| `src/ui/sidebar/` | Persistent game sidebar view. |
| `src/ui/startScreen/` | Start-screen view. |
| `src/ui/story/` | Story scene, event, and choice views. |
| `src/ui/textRenderer/` | Text rendering, formatting, animation, styling, and effects. |
| `src/ui/textRenderer/effects/` | Individual text animation effects and their shared base. |
| `tests/` | Vitest tests for the refactored TypeScript implementation. |

## Source files

| File | Responsibility |
| --- | --- |
| `src/STRUCTURE.md` | Current architecture and file-purpose guide for the TypeScript refactor. |
| `src/main.ts` | Composition root: constructs adapters and services, then starts the game on DOM readiness. |
| `src/app/startGame.ts` | Coordinates starting/resuming a game, user actions, saves, and story progression. |
| `src/constants/gameState.ts` | Default statuses, status limits, and sidebar influence-status definitions. |
| `src/constants/index.ts` | Public exports for shared runtime constants. |
| `src/constants/text/textRenderOptions.ts` | Default text-rendering options. |
| `src/content/events.ts` | Authored random-event definitions. |
| `src/content/scenes.ts` | Combines chapter scene maps into the complete story-scene map. |
| `src/content/chapters/floor-00/scenes.ts` | Authored scenes for floor 0. |
| `src/content/chapters/floor-01/scenes.ts` | Authored scenes for floor 1. |
| `src/domain/effects/effectEngine.ts` | Applies and expires temporary/permanent story effects. |
| `src/domain/encounters/randomEncounters.ts` | Selects random events according to weights and scene eligibility. |
| `src/domain/player/player.ts` | Player model, attributes, health, levels, and debuffs. |
| `src/domain/qte/qteSequence.ts` | Runs QTE countdown/rounds and calculates results. |
| `src/domain/save/newGameFactory.ts` | Creates the initial game state. |
| `src/domain/story/storyEngine.ts` | Applies choices and effects, validates navigation, and advances story state. |
| `src/infrastructure/browser/animationClock.ts` | Animation clock backed by browser timing APIs. |
| `src/infrastructure/persistence/localSaveRepository.ts` | Reads, validates, migrates, and writes local game saves. |
| `src/interfaces/gameStateFactory.ts` | Contract for creating a new game state. |
| `src/interfaces/index.ts` | Public exports for application and UI ports. |
| `src/interfaces/qteView.ts` | Contract for playing a QTE in a view. |
| `src/interfaces/randomEncounters.ts` | Contract for selecting random encounters. |
| `src/interfaces/saveRepository.ts` | Contract for save/load persistence. |
| `src/interfaces/startScreen.ts` | Start-screen actions and view contract. |
| `src/interfaces/storyEngine.ts` | Contract for story-state operations. |
| `src/interfaces/storyView.ts` | Story-view contract, render options, and text-render requests. |
| `src/interfaces/text/animationClock.ts` | Clock/scheduler contract used by animations. |
| `src/interfaces/text/index.ts` | Public exports for text-related ports. |
| `src/interfaces/text/preferences.ts` | Contract for reading and updating text preferences. |
| `src/interfaces/text/textAnimator.ts` | Contract for dispatching text animation requests. |
| `src/interfaces/text/textEffect.ts` | Contract for a text animation effect. |
| `src/interfaces/text/textRenderer.ts` | Text-renderer request and renderer contracts. |
| `src/types/events.ts` | Event and event-location data shapes. |
| `src/types/gameState.ts` | Persistent game-state data shape. |
| `src/types/index.ts` | Public exports for shared data types. |
| `src/types/qte.ts` | QTE configuration and result data shapes. |
| `src/types/story.ts` | Story scenes, choices, destinations, and effects data shapes. |
| `src/types/text.ts` | Text options, timing, position, and animation data shapes. |
| `src/ui/qte/barQteView.ts` | DOM view for the bar-style quick-time event. |
| `src/ui/sidebar/sidebarView.ts` | Renders status, character details, effects, and discoveries. |
| `src/ui/startScreen/startScreen.ts` | Renders start/continue actions and status messages. |
| `src/ui/story/storyChoiceList.ts` | Builds accessible story/event choice navigation. |
| `src/ui/story/storyContentView.ts` | Builds scene content and combines scene and event elements. |
| `src/ui/story/storyEventView.ts` | Renders a random event and its choices. |
| `src/ui/story/storyView.ts` | Coordinates story rendering, text, QTEs, and sidebar updates. |
| `src/ui/textRenderer/effects/abstractTextEffect.ts` | Shared lifecycle and timing behavior for text effects. |
| `src/ui/textRenderer/effects/fadeEffect.ts` | Fade animation effect. |
| `src/ui/textRenderer/effects/scrambleEffect.ts` | Scramble animation effect. |
| `src/ui/textRenderer/effects/typewriterEffect.ts` | Typewriter animation effect. |
| `src/ui/textRenderer/storyTextRenderer.ts` | Renders story text into DOM elements and applies options/styles. |
| `src/ui/textRenderer/textAnimator.ts` | Selects and runs a configured text effect. |
| `src/ui/textRenderer/textFormatting.ts` | Splits authored text into renderable lines. |
| `src/ui/textRenderer/textStyler.ts` | Applies and restores text colors and snippet styling. |

## Test files

| File | Coverage |
| --- | --- |
| `tests/effectEngine.test.ts` | Effect application, expiration, debuffs, and invalid inputs. |
| `tests/fadeEffect.test.ts` | Fade-effect cleanup when animation is skipped. |
| `tests/localSaveRepository.test.ts` | Save persistence, schema migrations, and malformed-save handling. |
| `tests/player.test.ts` | Player health, levels, debuffs, and input validation. |
| `tests/qteSequence.test.ts` | QTE execution, aggregation, validation, and cancellation. |
| `tests/randomEncounters.test.ts` | Encounter eligibility, weighted selection, and multiple-event rules. |
| `tests/startGame.test.ts` | Start/resume flows, choices, persistence, and game-over handling. |
| `tests/storyContent.test.ts` | Migrated story scenes, authored mechanics, and destinations. |
| `tests/storyEngine.test.ts` | Story navigation, choice effects, conditions, and state updates. |
| `tests/storyTextRenderer.test.ts` | DOM text rendering, formatting, colors, and animation behavior. |
| `tests/storyView.test.ts` | Story/sidebar UI rendering, QTE flow, and choice interactions. |
| `tests/textAnimator.test.ts` | Text-effect dispatch, immediate rendering, and skip behavior. |
| `tests/textFormatting.test.ts` | Newline and line-element formatting behavior. |
