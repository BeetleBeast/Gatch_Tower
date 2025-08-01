

// Render_Scene(saveData, true);

function Render_Scene(saveData, isNew = false) {
    if ( isNew ) impromptuSave(saveData) /* save the game from latest version of saveData */
    saveData = JSON.parse(sessionStorage.getItem('TempLatestSave'));

    // Count Time
    startForcedDelay(0.6)
    // Render content in order
    setEventListener()
    // --- UI Rendering Main ---
    // clear Text & Buttons
    
    clearText();
    clearButtonText();

    if ( !tryRandomEncounter(true) ) {
        populateButton( !saveData.CurrentDebuff_Effects.filter(effect => effect === 'confused')); // 1. Button's and teir Visibility, Text's Visibility, Item's Visibility and actions, 
        populateText(saveData); // 2. Populate text in main section
    }
    // --- UI Rendering Side-Menu ---
    // GameCicle // 3. day & night cicle
    character_Description(saveData, saveData.Choices_Made[saveData.currentScene.split('_')[0] || 0]); // 4. Character description if applicable
    GlobalQuerySelect.Side_Menu3.dataset.visible =  saveData.dead.isDead ? 'false' : 'true'; // 5. Side menu ( show or hide the effects (debuffs) bar )
    Effect_Bar_progress(saveData, saveData.Debuff_SpashText_Final); // 6. Effect bar if applicable
    // --- UI Rendering Map ---
    if (isCanvasActive(saveData.Canvas, saveData.currentScene)) saveData.Canvas.Map.forEach(MapList => CreateMap(MapList));
    // --- UI Rendering Inventory ---
    populateInventory(saveData, 1); // 8. Inventory ( only first page )
    //DisplayDebuffTextWithColors(saveData,)
    return saveData;
}
function impromptuSave(saveData) {
    //  make a save of latest version of saveData
    let currentdate = new Date();
    const datetime = currentdate.getDate() + "/" + (currentdate.getMonth()+1)+ "/" +
        currentdate.getFullYear() + " | " + currentdate.getHours() + ":" + 
        currentdate.getMinutes() +":" + currentdate.getSeconds();
    if(!ResetFile){
        let SaveForest = JSON.parse(localStorage.getItem('SaveForest') || '{}');
        SaveForest.section0 = saveData;
        saveData['LastSaved'] = datetime;
        SaveForest.DefaultSaveData = saveData; // optionally keep DefaultSaveData updated
        sessionStorage.setItem('TempLatestSave',JSON.stringify(saveData));
        localStorage.setItem('SaveForest', JSON.stringify(SaveForest));
    }
}
/**
 * Manages the visibility and discovery of hidden game elements using a modern object parameter approach.
 * Handles three main types of hidden content discovery mechanics with improved flexibility:
 * 
 * 1. **Hidden Buttons**: Toggles button visibility based on current state or explicit button data
 * 2. **Hidden Text**: Reveals additional narrative content when triggered by specific conditions
 * 3. **Hidden Items**: Discovers items, adds to inventory, and displays discovery feedback
 * 
 * @param {Object} params - Configuration object for hidden element management
 * @param {Object} params.saveData - The main game save data object containing all game state
 * @param {string|number} [params.TextID] - ID of hidden text to reveal (undefined = skip text discovery)
 * @param {string|number} [params.ItemID] - ID of item to discover and add to inventory (undefined = skip item discovery)
 * @param {Array<Object>} [params.Btn] - Array of button objects with BtnID and IsVisible properties for explicit control
 * @param {number} params.Btn[].BtnID - Button identifier for DOM selection
 * @param {boolean} params.Btn[].IsVisible - Current visibility state (will be toggled)
 * 
 * @description
 * **Button Logic**: 
 * - If Btn array provided: Toggles each button's visibility and updates save state
 * - If no Btn array: Falls back to scene's existing hidden button data
 * 
 * **Text Discovery**: Reveals hidden narrative with blue styling, prevents duplicate reveals
 * 
 * **Item Discovery**: Adds to inventory with colored discovery text, prevents duplicates
 * 
 * @example
 * // Toggle specific buttons
 * manageHiddenInfo({
 *   saveData,
 *   Btn: [
 *     { BtnID: 5, IsVisible: false },
 *     { BtnID: 6, IsVisible: true }
 *   ]
 * });
 * 
 * // Discover hidden text
 * manageHiddenInfo({ saveData, TextID: 'secret_passage' });
 * 
 * // Discover item
 * manageHiddenInfo({ saveData, ItemID: 42 });
 * 
 * // Combined discovery
 * manageHiddenInfo({ 
 *   saveData, 
 *   TextID: 'treasure_found', 
 *   ItemID: 15,
 *   Btn: [{ BtnID: 3, IsVisible: false }]
 * });
 */
function manageHiddenInfo({
    saveData, 
    text, 
    item, 
    Btn
    }) {
    if (Btn !== undefined) {
        Btn.forEach(CountedBtn => {
            const MakeVisible = CountedBtn.visible !== true;
            const button = document.querySelector('.Btn_' + CountedBtn.BtnID);
            if (button) {
                button.style.display = MakeVisible ? "block" : "none";
                CountedBtn.visible = MakeVisible;
            }
        })
    }
    if(text !== undefined){
        text.forEach(IndividualText => {
            if(!IndividualText.visible) {
                const Alt_Text_Object = saveData.scenes[saveData.currentScene]?.ALT_Text;
                typeText({
                    MainElementID : '.TextBlock',
                    sceneTexts: { 
                        Lines: Alt_Text_Object['Hidden'],
                        Position: Alt_Text_Object['Position'] || 1 // default to center if not specified
                    },
                    options: {
                        printImmediately: true,
                        tempColorDuration:  1,
                        secondaryElement : true,
                        replace : false,
                        Coloring : { 
                            Color : Alt_Text_Object.Coloring?.Color || ['blue'],
                            duration: Alt_Text_Object.Coloring?.duration || 1,
                            Background : Alt_Text_Object.Coloring?.Background || [],
                            Onlysnipet : Alt_Text_Object.Coloring?.Onlysnipet || false,
                            snipet : Alt_Text_Object.Coloring?.snipet || [],
                        },
                        MainElementBlock: `.Block_0`,
                    }
                })
                text.visible = true;
            }
        })
    }
    if(item !== undefined){
        const itemDiscoveryText = getItemDiscoveryText(item.itemID);
        //  add the item to the inventory and show the text if it is not already discovered
        if (itemDiscoveryText && !item.visible) {
            addItemToInventory(saveData, item.itemID, 1);
            typeText({
                MainElementID : '.TextBlock',
                sceneTexts: { 
                    Lines: itemDiscoveryText.Discoverytext,
                    Position: 3 // default to ItemBox
                },
                options: {
                    printImmediately: true,
                    tempColorDuration:  1,
                    secondaryElement : true,
                    replace : false,
                    Coloring : { Color : [itemDiscoveryText?.color], duration: 1 },
                    secondaryElementTitle: itemDiscoveryText?.DevElementName,
                    MainElementBlock: `.Block_0`,
                }
            })
            item.visible = true;
        }
    }
    sessionStorage.setItem('TempLatestSave', JSON.stringify(saveData));
    return saveData;
}
function damageAndDeath(amount, method, instaKill = false) {
    const isDead = instaKill || character.Health - amount <= 0;
    if (isDead) {
        handleDeath(method);
    } else {
        character.getDamage(amount);
    }
}
function handleDeath(reason = "unknown") {
    console.warn(`Player died: ${reason}`);

    saveData.dead.isDead = true;
    saveData.dead.deathReason = reason;

    // Store where the player died
    saveData.AtDeathScreen = {
        AtDeath_storyLine_progress: saveData.currentScene.split('_')[1],
        AtDeath_Chapter_progress: saveData.currentScene.split('_')[0],
        AtDeath_Title_progress: saveData.currentScene.split('_')[0],
    };

    const deathScene = saveData.scenes["Death"];
    deathScene.sceneText = `You died because ${reason}`;
    deathScene.options[1].next_scene = saveData.dead.LastSafeScene;

    // Reset health if needed
    if (typeof character?.Resurrect === "function") {
        character.Resurrect();
    }

    // Move to the death screen
    saveData.currentScene = "Death";

    clearButtonContent();
    Render_Scene(saveData, true);
}

function InventoryItemClickedHandler(item_id){
    switch(item_id){
        case 1:
            if (DebugMode) console.log('you died id=500')
            damageAndDeath(undefined,'you used the soul redeemer',true)
            break;
        case 4:
            //  a green gemstone something
            break;
    }
}
function character_Description(saveData, Choices_Made){
    //  check wat in Side-Menu2 is, if not the same as character_Description_Text_Final replace it with It
    GlobalQuerySelect.Side_Menu2.dataset.visible = saveData.dead.isDead ? 'false' : 'true'; //  show or hide the character description
    if (GlobalQuerySelect.Side_Menu2.innerHTML !== saveData.character_Description_Text_Final && ( saveData.currentScene.split('_')[1] >= 3 || saveData.currentScene.split('_')[0] >=1 )){
        GlobalQuerySelect.Side_Menu2.innerHTML = saveData.character_Description_Text_Final;
    }
}
function Effect_Bar_progress(saveData, CurrentDebuffBar){
    //  check wat in Side-Menu4 is, if not the same as Debuff_SpashText_Final replace it with It 
    GlobalQuerySelect.Side_Menu4.dataset.visible = saveData.dead.isDead ? 'false' : 'true'; //  show or hide the debuff bar
    if (GlobalQuerySelect.Side_Menu4.innerHTML !== saveData.Debuff_SpashText_Final) {
        GlobalQuerySelect.Side_Menu4.innerHTML = saveData.Debuff_SpashText_Final;
    }
}
function populateInventory(saveData,pageNumber) {
    // Function to populate inventory grid based on current page
    let number = 1;
    Inventory_Content(pageNumber);
    const inventoryItems = saveData.Inventory;
    const pageSize = 16; // Number of items per page (adjust based on grid size)

    const pageContainer = document.querySelector(`.page${pageNumber}`);
    pageContainer.innerHTML = ''; // Clear previous items

    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, inventoryItems.length);
    const itemsToShow = inventoryItems.slice(startIndex, endIndex);
    itemsToShow.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('inventoryItem');
        itemElement.textContent = `${item.Name} x${item.quantity}`;
        itemElement.id = `item-${number} itemType-${item.id}`;

        // Add click event listener to each item
        itemElement.addEventListener('click', () => {
            // Call the click handler function passing the item id or class
            InventoryItemClickedHandler(item.id); // Example: Passing item id
        });

        pageContainer.appendChild(itemElement);
        number++;
    });
    if (saveData.dead.isDead) GlobalQuerySelect.Inventory.style.display = 'none'; // Hide inventory if player is dead
}
function addItemToInventory(saveData, itemId, newQuantity = 1) {
    // Find the item in Items by itemId
    const itemToAdd = saveData.Items.find(item => item.id === itemId);
    if (itemToAdd) {
        // Check if the item is already in the Inventory
        const existingItemIndex = saveData.Inventory.findIndex(item => item.id === itemId);
        if (existingItemIndex !== -1) {
            // If the item already exists in the Inventory, update its quantity
            saveData.Inventory[existingItemIndex].quantity += newQuantity;
        } else {
            // If the item is not in the Inventory, add it with the specified quantity
            saveData.Inventory.push({
                id: itemToAdd.id,
                Name: itemToAdd.Name,
                quantity: newQuantity,
                color: itemToAdd.color,
                quality: itemToAdd.quality
            });
        }
        // Call function to update the inventory display
        populateInventory(saveData, 1);
    } else {
        console.error(`Item with id ${itemId} not found in Items.`);
    }
}
function populateText(saveData) {
    //  populate text in main section
    const current_title_progress = saveData.currentScene.split('_')[0] || 0;
    const currentScene = saveData.scenes[saveData.currentScene];
    const currentSceneText = currentScene.sceneTexts;
    const currentSceneName = currentScene.sceneName;
    const currentTitle = currentScene.chapterTitle;
    const currentSectionTitle = currentScene.ButtonTitle;
    title_progress(currentTitle, current_title_progress);
    scene_progress(currentSceneText, currentSceneName);
}
function title_progress(current_title,current_title_progress) {
    typeText({
        MainElementID : '.Quest_Title',
        sceneTexts: { 
            Lines: current_title,
            Position: 'default' // default to center
        },
        options: {
            secondaryElement: false
        }
    })
    if (DebugMode) console.log('current_title',current_title);
    if (DebugMode) console.log('current_title_progress', current_title_progress);
}
function scene_progress(currentSceneText,currentSceneName) {
    typeText({
        MainElementID : '.TextBlock',
        sceneTexts: {
            Lines: currentSceneText.Lines,
            Position: currentSceneText.Position || 1 // default to Left if not specified
        },
        options: {
            speed : 35,
            MainElementBlock: `.Block_0`,
        }
    })
    saveData.dead.deathReason = undefined;
    if (DebugMode) console.log('currentSceneName', currentSceneName);
    if (DebugMode) console.log('currentSceneText', currentSceneText);
}
function navigateStory(saveData, { direction = 'next', level = 'scene', NextScene = '' }) {
    let [chapter, scene] = saveData.currentScene.split('_').map(Number);
    let [current_chapter, current_scene] = chapter === 'Death' ? [chapter,scene] : [parseInt(chapter), parseInt(scene)]
    // death handling
    if (saveData.dead.isDead) {
        const [safeChapter, safeScene] = saveData.dead.LastSafeScene.split('_').map(Number);
        saveData.currentScene = saveData.dead.LastSafeScene || "0_0";
        Object.keys(saveData.Choices_Made).forEach((chapterKey) => {
            const chapterNum = Number(chapterKey);
            if (chapterNum > safeChapter) {
                saveData.Choices_Made[chapterKey] = [];
            } else if (chapterNum === safeChapter) {
                // Optional: trim choices from the same chapter
                saveData.Choices_Made[chapterKey] = saveData.Choices_Made[chapterKey].slice(0, safeScene);
            }
        });
        saveData.dead.isDead = false;
        saveData.dead.deathReason = null;
        saveData.AtDeathScreen = ''
        clearButtonContent();
        Render_Scene(saveData, true);
        return;
    }
    // SaveScene handling
    if (saveData.currentScene == saveData.dead.safeScenes?.[saveData.currentScene]) saveData.dead.LastSafeScene = `${current_chapter}_${current_scene}`;

    let lastChoiceIndex = saveData.Choices_Made[current_chapter].length - 1;
    let LastButtonPressed = direction === 'next' ? saveData.Choices_Made[current_chapter][lastChoiceIndex] : 1;


    const sceneKeys = Object.keys(saveData.scenes)
        .filter(key => key.startsWith(`${current_chapter}_`))
        .map(key => parseInt(key.split('_')[1]))
        .sort((a, b) => a - b);

    const sceneData = saveData.scenes[saveData.currentScene];
    const options = Object.values(saveData.scenes[saveData.currentScene].options)?.find(b => b.ButtonNumber === LastButtonPressed);
    if ((!Object.values(sceneData?.options)?.find(b => b.ButtonNumber === LastButtonPressed)) && direction !="previous") {
        console.warn("No valid options available.");
        return;
    }
    const [next_chapter, next_scene] = (options.next_scene ? options.next_scene.split('_') : [undefined,undefined]);
    if (level === 'scene') {
        const ChapterAcessPoint = saveData.scenes?.[options?.next_scene]?.ChapterAcessPoint;
        let currentIndex = sceneKeys.indexOf(current_scene);
        if (direction === 'next') {
            if( options.next_scene === 'DeadEnd') return;
            if (!options.next_scene && options.next_scene !== undefined) {
                // if its an end point only do the action if it exist and go no-where
                if (options.action) performSceneAction(options.action, saveData);
                return;
            }
            // if next scene is not defined, use the next scene in the chapter
            options.next_scene = options?.next_scene || `${current_chapter}_${sceneKeys[currentIndex + 1]}`;
            // if next scene gets undefined, set the next chapter in the scene
            if ( options.next_scene.includes('undefined')) options.next_scene = `${current_chapter+1}_${0}`;
            if (next_chapter == saveData.currentScene.split('_')[0]) {
                // Move to the next scene
                current_scene = options.next_scene? next_scene : sceneKeys[currentIndex + 1];
                // Perform custom action if specified
                if (options.action) performSceneAction(options.action, saveData);
            } else {
                return navigateStory(saveData, { direction: 'next', level: 'chapter' });
            }
        } else if (direction === 'previous') {
            if (!options.next_scene && options.next_scene !== undefined) {
                // if its an end point only do the action if it exist and go no-where
                if (options.action) performSceneAction(options.action, saveData);
                return;
            }
            current_scene = options.next_scene? next_scene : sceneKeys[currentIndex - 1];
            current_chapter = options.next_scene? next_chapter : current_chapter;
            if (options.action) performSceneAction(options.action, saveData);

        }
        saveData.currentScene = `${current_chapter}_${current_scene}`;
    }

    if (level === 'chapter') {
        if (direction === 'next' && current_chapter < Object.keys(saveData.scenes).length - 1) {
            current_chapter = next_chapter || current_chapter + 1;
            current_scene = next_scene || 0;
        } else if (direction === 'previous' && current_chapter > 0) {
            current_chapter = next_chapter || current_chapter - 1;
            current_scene = next_scene || 0;
            console.warn('NOT Used anymore')
        } else {
            if (DebugMode) console.log('No more chapters in this direction.');
            return;
        }
        saveData.currentScene = `${current_chapter}_${current_scene}`;
    }

    clearButtonContent();
    Render_Scene(saveData, true);
}
function nextScene(saveData) {
    navigateStory(saveData, { direction: 'next', level: 'scene' });
}

function previousScene(saveData) {
    navigateStory(saveData, { direction: 'previous', level: 'scene' });
}

function nextChapter(saveData) {
    navigateStory(saveData, { direction: 'next', level: 'chapter'});
}

function previousChapter(saveData) {
    navigateStory(saveData, { direction: 'previous', level: 'chapter' });
}
function getItemDiscoveryText(id){
    const ID = Number(id);
    return saveData.Items.find(entry => entry.id === ID);
}
function characterMaker(saveData, lastChoiceIndex, valueString, valueColor){
    //  Update class value
    console.log('characterMaker online')
    const characterKeys = {
        2: 'eye_Color',
        3: 'hair_style',
        4: 'skin_complexion',
        5: 'stature',
        6: 'attire',
        7: 'gender'
    };
    
    const keyToUpdate = characterKeys[lastChoiceIndex];
    if (keyToUpdate) {
        character[keyToUpdate] = valueString;
    }

    // Update the value arrays
    valueSTRING.push(valueString);
    valueCOLOR.push(valueColor);

    // Get template string
    const templateString = saveData.character_Description_Text[lastChoiceIndex].charachterDefining;

    // Evaluate it as a template literal
    const charachterDefining = new Function('value', 'valueSTRING', `return \`${templateString}\`;`)(valueString, valueSTRING);

    //  Display text to Side Menu
    // GlobalQuerySelect.Side_Menu2.innerHTML = charachterDefining;

    typeText({
        MainElementID: '.Side-Menu2',
        sceneTexts: { 
            Lines: charachterDefining,
            Position: 2 // default to center
        },
        options: {
            Coloring : { Onlysnipet : true, Color : valueCOLOR, snipet : valueSTRING },
            replace : true,
            secondaryElement: false,
        }
    })
    saveData.character_Description_Text_Final = GlobalQuerySelect.Side_Menu2.innerHTML;
}
function performSceneAction(actionObj, saveData) {
    // get chapter and scene
    const [ChapterStr, SceneStr] =  saveData.currentScene.split('_');

    const SplashText_Final = saveData.Debuff_SpashText_Final
    const SplashText = saveData.Debuff_SpashText;
    const Effect_Applied = saveData.CurrentDebuff_Effects;
    const Effect_Debuff = saveData.Debuff_Effects;
    const Effect_Buff = saveData.Buff_Effects;
    const Items = saveData.Items;

    const options = Object.values(saveData.scenes[saveData.currentScene].options).find(a => a.action === actionObj);
    const optionsBtnNum = options?.ButtonNumber;
    const ALT_options = Object.values(saveData.scenes[saveData.currentScene].ALT_options).find(BtnNum => BtnNum.ButtonNumber === optionsBtnNum);
    const ALT_Text = saveData.scenes[saveData.currentScene]?.ALT_Text?.['default'];
    const ALT_Name = saveData.scenes[saveData.currentScene]?.ALT_Name;
    
    const { type, effect, strength, value, target, tag, textID, itemID, Btn, text,item, instaKill } = actionObj[0];
    //
    
    // effectHandlers, ActionHandlers
    const handler = ActionHandlers[type];
    if (handler) {
        handler({
            saveData,
            SceneStr,
            effect,
            strength,
            value,
            target,
            tag,
            textID,
            itemID,
            Btn,
            text,
            item,
            instaKill,
            optionsText: options?.ButtonText,
            altOptionsText: ALT_options?.ButtonText,
            ALT_Text,
            ALT_Name,
        })
    } else {
        console.warn("Unknown action type: " + type);
    }
    // Handle chained actions if needed
    if (actionObj.length > 1) {
        performSceneAction(actionObj.slice(1), saveData);
    }
    // options.forEach(action => performSceneAction(action, saveData));
}
/**
 * Helper to know Story actions
 * chapter _ scene
 * // TODO: make 1_7 and further
 * Death => do death scene
 * 0_2
 * 0_3
 * 0_4
 * 0_5
 * 0_6
 * 0_7 => characterMaker(saveData, lastChoiceIndex, valueString, valueColor)
 * 1_6 => 
        Btn 2:
            //  Investigate the hidden alcove
            nextScene(saveData);//  I.E. scene 12
        Btn 3:
            character.rested(10);
            DeBuffParentFunction('Pacified', 20, saveData, ".BtnBlock")
            DeBuffParentFunction('Confusion', 20, saveData, ".BtnBlock")
            //  Listen to the soothing melody of the flower
        Btn 4:
            //  Continue exploring the passage
            nextScene(saveData);
        Btn 5:
            character.rested(20)
        Btn 6:
            //  Feel the texture of the moss beneath your fingertips
            TextBlock.appendChild(document.createElement('br'));
            manageHiddenInfo(saveData, true, 0)
 * 1_7 =>
        Btn 2:
            //  you fall in the water and die if requirement is not activated if it is aquire mysterious figure
        Btn 3:
            //  nothing happens
        Btn 4:
            //  the stone disolves in the water
        Btn 5:
            //  get silence back
        Btn 6:
            //  get damage
            damageAndDeath(15,'of an ambiguous pond of glazend color')
 * 1_8 =>
        Btn 2:
            //  feel drouwsy as not anouth mana ( player will not get info as comprehencion is to low )
        Btn 3:
            //  comprencion too low
        Btn 4:
            //  nextcene
            nextScene(saveData);
        Btn 5:
            //  +? in theoretical int
        Btn 6:
            //  +? in practical int
 * 1_9 =>
        Btn 2:
            //  Follow the stream to its source
            nextScene(saveData);
        Btn 3:
            //  
        Btn 4:
            //  
        Btn 5:
            //  
        Btn 6:
            //  
 * 1_10 =>
        Btn 2:
            //  
        Btn 3:
            //  
        Btn 4:
            //  
        Btn 5:
            //  
        Btn 6:
            //  
 * 1_11 =>
        Btn 2:
 * 1_12 =>
        Btn 2:
            //
        Btn 6:
            manageHiddenInfo(saveData, undefined, undefined, 4)



            // add special sircumstances for 7 to 10 (sometimes go to other scene or add to inventory )
            
            //    7 : { 1 : "Leave the area undisturbed", 2 : "Approach the figure cautiously.", 3 : "Sit quietly by the pool and observe.", 4 : "Cast a stone into the pool.", 5 : "Attempt to communicate with the figure.", 6 : "Feel the cool crystal walls with your hands."},
            //    8 : { 1 : "Leave the area undisturbed", 2 : "Reach out to touch the ancient runes.", 3 : "Atempt to read the chant or incantation.", 4 : "Continue down the corridor.", 5 : "Meditate in front of the runes.", 6 : "Feel the texture of the walls for any irregularities."},
            //    9 : { 1 : "Leave the area undisturbed", 2 : "Follow the stream to its source.", 3 : "Offer a small offering of food to the fish.", 4 : "Take a moment to admire the surroundings.", 5 : "Feel the water with your hands.", 6 : "Listen to the soothing sound of the rushing stream."},
            //    10 : { 1 : "Leave the area undisturbed", 2 : "Sit amongst the mushrooms and observe.", 3 : "Reach out to touch the mushrooms.", 4 : "Inhale deeply, breathing in the aroma.", 5 : "Feel the texture of the ground beneath your feet.", 6 : "Listen for any sounds emanating from the grove."},
            
 */