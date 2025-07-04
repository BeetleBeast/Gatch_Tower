const ActionHandlers = {
    characterMaker: ({ saveData, SceneStr, optionsText, altOptionsText }) => {
        characterMaker(saveData, SceneStr, optionsText, altOptionsText);
    },
    rested: ({ value }) => {
        character.rested(value);
    },
    DeBuffParentFunction: ({ effect, strength, target, ALT_Text, ALT_Name }) => {
        const handler = effectHandlers[effect];
        const argsObj = {
            effect,
            strength,
            target,
            ALT_Text,
            ALT_Name,
            amount: strength,
            element: document.querySelector(target),
            saveData,
            elementId : target
        };
        if (handler) handler(argsObj);
        else console.warn("Unknown effect: " + effect);
    },
    createElement: ({ tag }) => {
        if (tag) {
            document.querySelector('.TextBlock').appendChild(document.createElement(tag));
        }
    },
    manageHiddenInfo: ({ saveData, textID, itemID, Btn}) => {
        if ( textID || itemID || Btn) {
            manageHiddenInfo({saveData, TextID: textID, ItemID: itemID, Btn});
        }
    },
    damageAndDeath: ({ text, value, instaKill }) => {
        if (text && (value || instaKill)) {
            damageAndDeath(value, text, instaKill);
        }
    },
};

const effectHandlers = {
    Blinded: ({ amount, element }) => element.style.opacity = amount / 100,
    pacified: ({ saveData, elementId }) => {
            // not able to be agressief
            character.applyDebuff('pacified', undefined, saveData, elementId);
        },
    Confusion: ({ ALT_Text, ALT_Name, saveData }) => {
        // change text to confused text
        if (DebugMode) console.log('activate confusion')
        typeText({
            MainElementID : '.TextBlock',
            sceneTexts: {
                Lines: ALT_Text,
                Position: 2 // default to center
            },
            options: {
                speed : 35,
            }
        })
        typeText({
            MainElementID : '.Quest_Title',
            sceneTexts: {
                Lines: ALT_Name,
                Position: 2 // default to center
            },
            options:{
                secondaryElement: false,
            }
        })
        if ( saveData.CurrentDebuff_Effects.filter(effect => effect !== 'confused') ) saveData.CurrentDebuff_Effects.push('Confused');
        populateButton(true); //  re-render buttons
    },
    Weakened : () => {},
    Slowed : () => {},
    // Confused : () => {},
    Silenced : () => {},
    Crippled : () => {},
    Vulnerable : () => {},
    Disarmed : () => {},
    Diseased : () => {},
    Fear : () => {},
    Stunned : () => {},
    Hexed : () => {},
    Drained : () => {},
    Sapped : () => {},
    Marked : () => {},
    Burning : () => {},
    Chilled : () => {},
    Rooted : () => {},
    Cursed : () => {},
    Fatigue : () => {},
    MAXeffect : () => {}
};