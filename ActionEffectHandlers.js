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
    manageHiddenInfo: ({ saveData, text, item, Btn}) => {
        if ( text || item || Btn) {
            manageHiddenInfo({saveData, text, item, Btn});
        }
    },
    damageAndDeath: ({ text, value, instaKill }) => {
        if (text && (value || instaKill)) {
            damageAndDeath(value, text, instaKill);
        }
    },
    QTE: ({ amountQTE, duration, QTE_settings, variables }) => {
        const CustomBluePrintPosition = (QTE_blueprint) => QTEBlueprint(QTE_blueprint);
        const CustomAmountorDuration = (amount, dur) => {
            let int_amountQTE, int_duration;
            if (typeof amount === 'string') int_amountQTE = CustomText({ value: amount }, variables, Number).value;
            else if (typeof amount === 'number') int_amountQTE = parseInt(amount);
            if (typeof dur === 'string') int_duration = CustomText({ value: dur }, variables).value;
            else if (typeof dur === 'number') int_duration = parseInt(dur);
            return [int_amountQTE, int_duration];
        }
        const [ int_amountQTE, int_duration ] = CustomAmountorDuration(amountQTE, duration);

        if (QTE_settings?.hasBlueprint) {
            runQTESequence(int_amountQTE, int_duration, QTE_settings.Input, QTE_settings.countDown, CustomBluePrintPosition(QTE_settings.blueprint));
        } else if (!QTE_settings.hasBlueprint && QTE_settings.CustomPosition) {
            runQTESequence(int_amountQTE, int_duration, QTE_settings.Input, QTE_settings.countDown, QTE_settings.CustomPosition);

        } else {
            runQTESequence(int_amountQTE, int_duration, QTE_settings.Input, QTE_settings.countDown);
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
                Position: 'default' // default to center
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

function Action(saveData, action, variables = {}) {
    if (action && action.length > 0) {
        action.forEach((actionItem) => {
            const handler = ActionHandlers[actionItem.type];
            if (handler) {
                actionItem.variables = variables;
                handler(actionItem);
            } else {
                console.warn("Unknown action: " + actionItem.action);
            }
        });
    }
}