# 📘 Gatsha Tower — Game Design Overview & Development Notes

---

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

- [ ] Add enemy system with AI and combat logic.
- [ ] Implement multiple text styles and save them.
- [ ] Create a loot screen tied to inventory system.
- [ ] Build full player controller (movement, interaction).
- [ ] Add touch controls (mobile support).
- [ ] Generate and test APK build for Android.
- [ ] Simplify cave level for first encounter.

- [ ] Remake the settings menu. ( only 1 instead of 3)
- [ ] add better flavour text.
- [ ] add a better intro.

- [ ] add a way to make text and buttons print inbetween each other.
- [ ] charackter maker is broken ( text and dsecription are seperated ).

---

## 🐞 FIXMEs

- [ ] fix the REncounter bug that leaves thext behind
- [ ] fix a bug where the buttons sometimes don't work.

---

## 🔄 Notes for Iteration

- Keep the game world dynamic and reactive.
- Layer in surprises and secrets for replay value.
- Test emotional beats using music/sound during key moments.

#SelfMade