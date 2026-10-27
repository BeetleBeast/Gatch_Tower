# 📘 Gatsha Tower — Game Design Overview & Development Notes

---

## 🛠️ Running the TypeScript version

Install dependencies with `npm install`, then run `npm run dev`. Vite opens the game at `http://127.0.0.1:5173/GachaTower.html` and serves TypeScript directly with hot reload.

Run `npm run build` to type-check the TypeScript and create a production build in `dist/`.

## 🎮 Game Concept

**Title:** *Gatsha Tower*  
**Genre:** Tower Defense / Tower Power-Up Hybrid  
**Platform:** PC / Mobile (APK build planned)  

**Core Mechanics:**

- Progress through a tower where each floor represents a chapter.
- Optional secret floors for exploration.
- Decision-based storytelling and varied gameplay mechanics.

---

## 📖 Narrative & Storytelling

- **Compelling Storyline**  
  Craft an immersive narrative with memorable characters, plot twists, and meaningful choices.

- **Interactive Choices**  
  Player decisions must impact the story. Branching paths increase replayability.

- **Rich Descriptions**  
  Use vivid language to describe locations, characters, and events.

- **Surprise and Discovery**  
  Hide secrets and include unexpected events. Reveal lore gradually to maintain curiosity.

---

## 🧱 Gameplay & Systems

### 🧠 Player Mechanics

- Input handling: Keyboard, mouse, and touch support.
- Movement actions consume **Fatigue (5%)**.
- Side inventory menu; **press item for more options**.

### 💢 Combat & Interaction

- Enemy system with spawning, pathfinding (A*), targeting logic.
- AI using behavior trees or state machines.
- Combat includes hit detection, damage calculation, and cooldowns.
- Optional spell/weapon logic.

### 💼 Inventory & Loot

- Full inventory system for pickups, gear, and consumables.
- **Loot screen** to view and collect items.
- Economy: Gold/premium currency, shop system, price balancing.

### 🧭 Quests & Objectives

- Track objectives and progress.
- Rewards tied to quest completion.
- Structure: Linear, branching, or open-ended.

### 📈 Leveling / Progression

- Player XP, skill trees, stat upgrades.
- Unlockables tied to progression and exploration.

### 💾 Save/Load System

- Save system using LocalStorage, IndexedDB, or cloud sync.
- Support for autosave and manual saves.
- Save different types of text content.

---

## 🎨 UI / UX / Audio

- **Text Display**

  - Support multiple text styles.
  - Auto-progress text (no click required).
  - Tap/click anywhere to continue text when necessary.

- **Audio / Visuals**

  - Add sound effects and background music for atmosphere.
  - Implement **screen shake** for damage or events.
  - Add **restore effects** for healing or recovery events.

---

## 🏗️ Level Design

- Each **chapter = one floor** in the tower.
- Include **secret floors** for optional exploration.
- Simplify **cave area** for first-time visit; allow revisits with deeper content.

---

## 🧪 Testing & Polish

- Playtest frequently.
- Iterate based on player feedback.
- Balance difficulty with progression to avoid frustration.

---

## ✅ TODO List

- [ ] remove colors i.e. make it more grey scale
- [x] do something with the QTE response
- [ ] {
    make a fight scene when in QTE mode a.e. when it is counting down and let
    it dissapear when the results are in
  }
- [ ] make navigateStory actually usable instead of being a pain in the ass.

- [ ] implement a button to open Inventory ( I )
- [ ] implement actionMap.

- [ ] Implement multiple text styles and save them.
- [ ] add better flavour text.

- [ ] Create a loot screen tied to inventory system.

- [ ] Simplify cave level for first encounter.

- [ ] when ?? is high enauf add | effect will hapen on button example: (1) Run | fatigue{red}

- [ ] add a better intro.

- [ ] Add enemy system with AI and combat logic.

### Far Future

- [ ] Build full player controller (movement, interaction).
- [ ] Add touch controls (mobile support).
- [ ] Generate and test APK build for Android.

---

## 🐞 FIXMEs

- [ ] when 2 or more events are there buttons don't exist for those events

---

## 🔄 Notes for Iteration

- Keep the game world dynamic and reactive.
- Layer in surprises and secrets for replay value.
- Test emotional beats using music/sound during key moments.
