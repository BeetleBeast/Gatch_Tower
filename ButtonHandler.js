function populateButton( ISALT = false, REncounter = []) {
    const saveData = JSON.parse(sessionStorage.getItem('TempLatestSave'));
    const buttonValues = getButtonValues(saveData, REncounter, ISALT);
    
    clearButtonContent();
    BtnRenderer(saveData, buttonValues);
    manageHiddenInfo({ saveData });
    if (DebugMode) console.log('Buttons Rendered ' + JSON.stringify(buttonValues)); // Logging the addition of event listener
    return GlobalQuerySelect;
}
// Function to clear button content
function clearButtonContent() {
    document.querySelectorAll('.BtnBlock').forEach(block => {
        block.querySelectorAll('div[class*="Btn_"]').forEach(btn => {
            const btnClass = Array.from(btn.classList).find(className => className.startsWith('Btn_'));
            if (!btnClass) return;
            btn.remove();
        });
    });
    document.querySelectorAll('.Choices').forEach(button => {
        button.innerHTML = "";
        button.style.display = 'none';
    });
}
function BtnRenderer(saveData, buttonValues) {
    const GrandContainer = document.querySelector('.main');
    for (const buttonValue of buttonValues) {
        let button = null;
        button = document.createElement('div');
        button.classList.add('Choices', `Btn_${buttonValue.Value}`);

        const [sceneKey, groupID] = buttonValue.group.split('|');
        const blockIndex = groupID !== 'NONE' ? groupID : '0';
        
        let group = document.querySelector(`.InteractionBlock[data-block="${blockIndex}"]`);
        if( !group ) {
            group = InteractionBlock(undefined,blockIndex,0)
            GrandContainer.appendChild(group);
        }
        const BtnBlock = group.querySelector('.BtnBlock');
        BtnBlock.appendChild(button);
    
        if (button) {
            const totalRevealTime =  200; // Default to 200ms if not set
            button.style.opacity = 0;
            button.offsetHeight = 'undefined';
            button.innerHTML = `${buttonValue.Text}`;
            if (buttonValue?.Duration ) button.innerHTML += ` (${buttonValue?.Duration})`;
            if (buttonValue?.Interesting) button.innerHTML += ` (${buttonValue?.Interesting})`;
            button.style.animation = `${600}ms linear ${totalRevealTime}ms 1 normal forwards running fadeIn`;
            button.style.display = 'inline-block';
            button.dataset.position = buttonValue?.Position;

            const handler = ClickHandler(buttonValue.Value, saveData);
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener("click", handler);

        }
    }
}
/**
 * 
 * @param {Object} saveData
 * @param {boolean} ISALT - If true, retrieves values from ALT_options instead of options
 * @returns values inside the button(s) of the current scene
 * @description This function retrieves the button values from the saveData object for the current scene.
 */
function getButtonValues(saveData, REncounter, ISALT = false) {
    const buttonValues = [];
    let options = saveData.scenes[saveData.currentScene][ISALT ? 'ALT_options' : 'options'];
    if (REncounter.Name !== undefined) {
        for (const key in REncounter.options) {
            if (REncounter.options[key]?.ButtonText) {
                // If button number conflicts, assign a new number
                const ButtonText = REncounter.options[key]?.ButtonText
                const buttonNumber = Math.max(1,...Object.values(options).map(opt => opt?.ButtonNumber || 1)) + 1;
                const existingOption = Object.values(options).find(opt => opt?.ButtonText === ButtonText);
                if (!existingOption) {
                    const newKey = Object.keys(options).length;
                    options[newKey+1] = {
                        ButtonNumber: buttonNumber,
                        ButtonText: ButtonText,
                        Position: REncounter.options[key]?.Position || 1,
                        next_scene: REncounter.options[key]?.next_scene,
                        Duration: REncounter.options[key]?.duration || '', // Default to empty if duration is not specified
                        Interesting: REncounter.options[key]?.Interesting || '', // Default to empty if not specified
                        group: `${saveData.currentScene}|R${REncounter.REventID}`, // Here  chapter_scene|REventKey
                    };
                }
            }
        }
    }
    for (const key in options) {
        if ( options[key]?.ButtonText ) {
            buttonValues.push({
                Value: options[key]?.ButtonNumber,
                Text: options[key]?.ButtonText,
                Position: options[key]?.Position || 1,
                next_scene: options[key]?.next_scene,
                Duration: options[key]?.duration || '', // Default to empty if duration is not specified
                Interesting: options[key]?.Interesting || '', // Default to empty if not specified
                group: options[key]?.group || `${saveData.currentScene}|NONE`, // Here  chapter_scene|NONE
            });
        }
    }// FIXME : this can cause problems if keys not specified 
    return buttonValues;
}
function ClickHandler(buttonValue, saveData) {
    return () => {
        if (DebugMode) console.log('Button ' + buttonValue + ' pressed'); // Log button press
        if (!isCurrentlyPrinting[".TextBlock"]) {
            if (!ForcedDelay.isActive) {
                // stopTyping = false;
                if (buttonValue === 1) {
                    saveData.Choices_Made[saveData.currentScene.split('_')[0]].pop();
                    if (DebugMode) console.log( 'ClickHandler Back button ', saveData.Choices_Made[saveData.currentScene.split('_')[0]])
                    previousScene(saveData);
                } else {
                    saveData.Choices_Made[saveData.currentScene.split('_')[0]].push(buttonValue);
                    if (DebugMode) console.log( 'ClickHandler Forward button ', saveData.Choices_Made[saveData.currentScene.split('_')[0]])
                    nextScene(saveData);
                }
            }
        } else {
            // stopTyping = true;
            if (DebugMode) console.log('ClickHandler printImmediately, scene ', saveData.currentScene.split('_')[1]);
            typeText({
                MainElementID : '.TextBlock',
                sceneTexts: {
                    Lines : saveData.scenes[saveData.currentScene].sceneTexts.Lines,
                    Position: saveData.scenes[saveData.currentScene].sceneTexts.Position || 1 // default to Left if not specified
                },
                options: {
                    printImmediately : true,
                    MainElementBlock: `.Block_0`,
                }
            })
            typeText({
                MainElementID : '.Quest_Title',
                sceneTexts: {
                    Lines : saveData.scenes[saveData.currentScene].chapterTitle,
                    Position:  'default' // default to center if not specified
                },
                options: {
                    printImmediately : true,
                    secondaryElement: false
                }
            })
            isCurrentlyPrinting[".TextBlock"] = false;
            
        }
    }
}
function getButtonData(saveData, REncounter = {}, ISALT = false) {
    const sceneData = saveData.scenes[saveData.currentScene];
    const optionType = ISALT ? 'ALT_options' : 'options';
    const baseOptions = { ...sceneData[optionType] }; // Clone to avoid mutation
    const buttonValues = [];

    // Helper to generate unique ButtonNumber
    const getNextButtonNumber = () => {
        const numbers = Object.values(baseOptions)
            .map(opt => opt?.ButtonNumber || 0);
        return Math.max(0, ...numbers) + 1;
    };

    // Merge REncounter buttons (read-only!)
    if (REncounter.Name && REncounter.options) {
        for (const [key, encounterOpt] of Object.entries(REncounter.options)) {
            if (!encounterOpt?.ButtonText) continue;

            const isDuplicate = Object.values(baseOptions).some(opt => opt?.ButtonText === encounterOpt.ButtonText);
            if (isDuplicate) continue;

            const buttonNumber = getNextButtonNumber();
            const group = `${saveData.currentScene}|R${REncounter.REventID}`;
            
            buttonValues.push({
                Value: buttonNumber,
                Text: encounterOpt.ButtonText,
                Position: encounterOpt.Position || 1,
                next_scene: encounterOpt.next_scene,
                Duration: encounterOpt.duration,
                Interesting: encounterOpt.Interesting,
                group
            });
        }
    }

    // Add scene-defined options
    for (const opt of Object.values(baseOptions)) {
        if (opt?.ButtonText) {
            buttonValues.push({
                Value: opt.ButtonNumber,
                Text: opt.ButtonText,
                Position: opt.Position || 1,
                next_scene: opt.next_scene,
                Duration: opt.duration,
                Interesting: opt.Interesting,
                group: opt.group || `${saveData.currentScene}|NONE`
            });
        }
    }

    return buttonValues;
}
