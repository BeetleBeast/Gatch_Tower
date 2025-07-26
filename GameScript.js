let GlobalQuerySelect = {}
var currentdate = new Date();
var datetime = currentdate.getDate() + "/" + (currentdate.getMonth()+1) + "/" + currentdate.getFullYear() + "|" + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();
const valueSTRING = [];   // Initialize the text of the player character set feature 
const valueCOLOR = [];    // Initialize the color of the player character set feature 
let isCurrentlyPrinting = {}; // set true if is printing and false if not
const previousText = {};
let previousAmounts = [];
let ResetFile = false;// if true can't save latest as session is reseting
let CurrentPageNumber = 1;
let currentTypingToken = {};
let ForcedDelay = {
    isActive: false,
    timeRemaining: 0,
    intervalId: null
}; // in seconds ( makes the user wait to click again )


const DebugMode = true; // Set to true to enable debug mode


// Function to start up the game
window.onload = () => {
    startup(undefined)
    setEventListener()
};
// Function to start up or load the game
function startup(userConfirmed) {
    SetLoadingScreen(true);
    if (DebugMode) userConfirmed === 1 ? console.log('Continue story') : console.log('start new story');
    if (userConfirmed !== 1 && userConfirmed !== 2) {
        Title_Section(GlobalQuerySelect);
        TextBlock_Content(GlobalQuerySelect, undefined, undefined, false);
        GlobalQuerySelect.Title.innerHTML = 'Gatcha tower';
        StartUp_Content();
    }
    const TempLatestSave = JSON.parse(sessionStorage.getItem('TempLatestSave'));
    if ( TempLatestSave == null) {
        if (userConfirmed === 1) {
            if (DebugMode) console.log("User confirmed to load last save.");
            removeStartUpContent();
            loadLatestGame(0);
            return;
        }else if(userConfirmed === 2){
            if (DebugMode) console.log("User declined to load last save. Starting a new game.");
            removeStartUpContent();
            newGame();
            return;
        }
    }else{
        if (DebugMode) console.log('checking last Session')
        removeStartUpContent();
        loadLatestGame(1);
    }
    //load_S.dataset.visible = 'false';
}
/**
 * Loads and displays saved game data from localStorage.
 * 
 * Iterates through 6 possible save sections, updating the UI with save information:
 * - Enables/disables load game buttons based on save availability
 * - Displays save name and last saved timestamp
 * - Highlights the most recently saved game in green
 * - Handles color coding for different save types (e.g., 'Main' save in yellow)
 * 
 * @returns {void} Updates the DOM with save information, logs save details to console
 */
function LoadedSaves() {
    const saveForestString = localStorage.getItem('SaveForest');
    let lastbigesttime = 0;
    let LatestSpan = null;
    if (!saveForestString) { console.warn('SaveForest does not exist'); return; };
    //let saveData = {}; // Initialize saveData object
    let SaveForest = JSON.parse(saveForestString);
    for (let i = 0; i < 6; i++) {
        const sectionSpanName = document.getElementById(`gameName${i}`); // 0 - 5 
        let saveData = SaveForest[`section${i}`];
        if (i >= 0 && SaveForest[`section${i}`]) {
            document.querySelector(`.Section${i}_load_game`).disabled = false;
            document.querySelector(`.Section${i}_load_game`).classList.remove('disable');
            sectionSpanName.textContent = `${saveData['name']} | ${saveData['LastSaved']}`;
            let formattedTime = saveData['LastSaved'].replace(/[/:| ]/g, '');
            let timeAsNumber = parseInt(formattedTime);

            sectionSpanName.style.color = saveData['name'] === "Main" ? 'yellow' : 'purple';
            
            if (timeAsNumber >= lastbigesttime) {
                lastbigesttime = timeAsNumber;
                LatestSpan = sectionSpanName;
            }
        } else {
            sectionSpanName.innerHTML = ''; // Clear empty slots
            document.querySelector(`.Section${i}_load_game`).disabled = true;
            document.querySelector(`.Section${i}_load_game`).classList.add('disable');
        }
    }
    console.log('Game data loaded from localStorage with ' + ((Object.keys(SaveForest).filter(key => key.includes('section'))).length - 1) + ' saves. | [ ' + 
        Object.keys(SaveForest).filter(key => key.includes('section'))+ ' ].'
    );
    if ( LatestSpan) LatestSpan.style.color = 'green';
    
}
/** 
 * Loads and displays saved game data from localStorage.
 * 
 * Iterates through 6 possible save sections, updating the UI with save information:
 * - Enables/disables load game buttons based on save availability
 * - Displays save name and last saved timestamp
 * - Highlights the most recently saved game in green
 * - Handles color coding for different save types (e.g., 'Main' save in yellow)
 * 
 * @returns {void} Updates the DOM with save information, logs save details to console
*/
function setEventListener(){
    // Add event listener for Side Menu Colapse Button click
    if (GlobalQuerySelect.Side_Menu_ColapseButton?.dataset.listenerAdded) {
        GlobalQuerySelect.Side_Menu_ColapseButton.removeEventListener('click', Side_Menu_ColapseButtonClickHandler);
    }
    GlobalQuerySelect.Side_Menu_ColapseButton?.addEventListener("click", Side_Menu_ColapseButtonClickHandler);
    GlobalQuerySelect.Side_Menu_ColapseButton?.setAttribute('data-listener-added', 'true');

    // Add event listener for Side Menu Btn Load click
    if (GlobalQuerySelect.BtnLoad?.dataset.listenerAdded) {
        GlobalQuerySelect.BtnLoad.removeEventListener('click', handleLoadClick);
    }
    GlobalQuerySelect.BtnLoad?.addEventListener("click", handleLoadClick);
    GlobalQuerySelect.BtnLoad?.setAttribute('data-listener-added', 'true');

    // Add event listener for Side Menu Btn Info click
    if (GlobalQuerySelect.BtnInfo?.dataset.listenerAdded) {
        GlobalQuerySelect.BtnInfo.removeEventListener('click', handleInfoClick);
    }
    GlobalQuerySelect.BtnInfo?.addEventListener("click", handleInfoClick);
    GlobalQuerySelect.BtnInfo?.setAttribute('data-listener-added', 'true');

    // Add event listener for Side Menu Btn Settings click
    if (GlobalQuerySelect.BtnSettings?.dataset.listenerAdded) {
        GlobalQuerySelect.BtnSettings.removeEventListener('click', handleSettingsClick);
    }
    GlobalQuerySelect.BtnSettings?.addEventListener("click", handleSettingsClick);
    GlobalQuerySelect.BtnSettings?.setAttribute('data-listener-added', 'true');
}
const handleLoadClick = () => SettingsOverlay(1);
const handleInfoClick = () => SettingsOverlay(2);
const handleSettingsClick = () => SettingsOverlay(3);

// Function to load the game from localStorage
function loadLatestGame(userConfirmed) {
    try {
        let SaveForest = JSON.parse(localStorage.getItem('SaveForest') || '{}');
        let TempLatestSave = JSON.parse(sessionStorage.getItem('TempLatestSave') || '{}');
        let saveData;
        if(userConfirmed == 0){
            saveData = SaveForest['section0'];
        }else if(userConfirmed == 1){
            saveData = TempLatestSave;
        }
        if (DebugMode) console.log('Loaded save file:', saveData);
        clearButtonContent();
        ResetEffectBarToDefault(saveData);
        // Call the mergeDefaultProperties function to ensure saveData has all expected properties
        mergeDefaultProperties(saveData);
        SetLoadingScreen(false)
        Render_Scene(saveData, true);
    } catch (error) {
        if(error == TypeError){
            console.error('Error in SaveData:', error);
            SetLoadingScreen(false)
            Render_Scene(saveData, true);
        }else{
            console.error('Unkown Error by parsing SaveForest:', error);
            SetLoadingScreen(false)
            newGame(); // Fallback to starting a new game if loading fails
        }
        
        
    }
}

// newGame makes the prep for a new game
function newGame(){
    let SaveForest = JSON.parse(localStorage.getItem('SaveForest')|| '{}');
    if (!SaveForest || Object.keys(SaveForest).length === 0) {
        SaveForest = {
            'section0' : {},
            DefaultSaveData : saveData
        };
    }
    else {
        SaveForest.DefaultSaveData = saveData;
    }
    try{saveData.Player_character = Player;}
    catch(error){console.log('Can\'t set player because ',error);}
    
    localStorage.setItem('SaveForest', JSON.stringify(SaveForest));
    sessionStorage.setItem('TempLatestSave', JSON.stringify(saveData));

    // start story
    ResetEffectBarToDefault(saveData)
    SetLoadingScreen(false)
    Render_Scene(saveData, true);

}

function SetLoadingScreen(StartLoadingScreen, EndLoadingScreen){
    // Set the loading screen
    if(StartLoadingScreen === undefined) {
        let shouldLoadingScreenBeShown = EndLoadingScreen === true;
        return shouldLoadingScreenBeShown;
    }
    if (StartLoadingScreen) {
        showLoader();
    }
    if (!StartLoadingScreen) {
        hideLoader();
    }
}
/**
 * Starts ForcedDelay countdown
 * @param {number} seconds - Number of seconds to count down
 */
function startForcedDelay(seconds) {
    ForcedDelay.isActive = true;
    ForcedDelay.timeRemaining = seconds;
    
    ForcedDelay.intervalId = setInterval(() => {
        ForcedDelay.timeRemaining--;
        
        if (ForcedDelay.timeRemaining <= 0) {
            ForcedDelay.isActive = false;
            clearInterval(ForcedDelay.intervalId);
            ForcedDelay.intervalId = null;
        }
    }, seconds * 1000);
}
// Function to toggle visibility of the inventory
function toggleInventory() {
    const inventory = document.getElementById('Inventory');
    const SaveForest =  JSON.parse(localStorage.getItem('SaveForest'));
    const saveData = SaveForest['section0'];
    if (!saveData.dead.isDead) {
        GlobalQuerySelect.Inventory.style.display = (GlobalQuerySelect.Inventory.style.display === 'none') ? 'block' : 'none';
    } else {
        console.log('Player is dead, inventory cannot be opened.');
    }
}

// Event listener for key press (I key)
handleKeyPress();
function handleKeyPress() {
    const SaveForest =  JSON.parse(localStorage.getItem('SaveForest'));
    const saveData = SaveForest?.['section0'] || {};
    const Key = saveData?.Settings?.Controls?.Inventory || 'I';
    document.addEventListener('keydown', function(event) {
        if (event.key === Key.toLowerCase() || event.key === Key.toUpperCase()) {
            toggleInventory();
        }
    });
}
function openSettings(number) {
    let parent; // Declare parent variable outside the switch statement
    switch (number) {
        case 1:
            parent = document.querySelector('.parentLoad');
            break;
        case 2:
            parent = document.querySelector('.parentGaPla');
            break;
        case 3:
            parent = document.querySelector('.parentGrafic');
            break;
        case 4:
            parent = document.querySelector('.parentMore');
            break;
        default:
            return; // Handle default case or unexpected values
    }
    if (!parent) {
        console.error('Parent element not found.');
        return;
    }
    const isVisible = parent.dataset.visible === 'true';
    parent.classList.toggle('visible');
    parent.dataset.visible = !isVisible;
}
function ResetFileClickHandler(){
    if (DebugMode) console.log('Resetting File Btn clicked');
    let confirmed = confirm('Do you want to reset the game( all unsaved actions will be lost! ).');
    if (confirmed){
        sessionStorage.removeItem('TempLatestSave');
        if (DebugMode) console.log('Removed LatestsaveFile! id=809')
        ResetFile = true;
        window.location.reload();
    }else{
        return;
    }
}
function ResetEffectBarToDefault(saveData) {
    const barIds = ['Pain', 'Fatigue', 'Fear', 'Stress', 'Trauma', 'Addiction', 'Sickness', 'Bleed'];
    Side_Menu(barIds, GlobalQuerySelect);
    barIds.forEach(Bar => {
        DisplayDebuffTextWithColors(saveData, Bar, 0); // Display All bar text with color
    });
    DisplayDebuffTextWithColors(saveData, 'Control', 70); // Display Controlbar text with color
    saveData.Debuff_SpashText_Final = GlobalQuerySelect.Side_Menu4.innerHTML; // Save the final text of the debuff splash text

}
function DisplayDebuffTextWithColors(saveData, EffectId, BarLength) {
    
    const titleElement = document.querySelector(`.${EffectId}Title`);
    const EffectBar = document.querySelector(`.${EffectId}`);
    const index = Math.floor(BarLength / (8 + 1/3));
    if (EffectBar && BarLength < 100) {
        EffectBar.style.width = BarLength + '%';
        // EffectBar.dataset.visible = 'true';
    }
    // if ( BarLength == 0) EffectBar.dataset.visible = 'false';
    if (titleElement) {
        titleElement.innerHTML = ''; // Clear previous content
        if (index === 12) {
            titleElement.innerHTML = EffectId + ': ' + saveData.Debuff_SpashText[EffectId].Text[11];
            titleElement.style.color = saveData.Debuff_SpashText[EffectId].color[11];
           // EffectId.dataset.visible = 'true';
        }else if (index > 0 && index < 12) {
            titleElement.innerHTML = EffectId + ': ' + saveData.Debuff_SpashText[EffectId].Text[index - 1];
            titleElement.style.color = saveData.Debuff_SpashText[EffectId].color[index - 1];
         //   EffectId.dataset.visible = 'true';
        }else if (index === 0) {
            titleElement.innerHTML = EffectId + ': ' + saveData.Debuff_SpashText[EffectId].Text[0];
            titleElement.style.color = saveData.Debuff_SpashText[EffectId].color[0];
            //EffectId.dataset.visible = 'false';
        }
    }
    saveData.Debuff_SpashText_Final = GlobalQuerySelect.Side_Menu4.innerHTML; // Save the final text of the debuff splash text
}
function saveGame(NumSection){
    currentdate = new Date();
    const datetime = currentdate.getDate() + "/" + (currentdate.getMonth()+1)+ "/" +
        currentdate.getFullYear() + " | " + currentdate.getHours() + ":" + 
        currentdate.getMinutes() +":" + currentdate.getSeconds();
    let SaveForest = JSON.parse(localStorage.getItem('SaveForest') || '{}');
    let saveData = JSON.parse(sessionStorage.getItem('TempLatestSave'));
    const sectionSpanName = document.getElementById(`gameName${NumSection}`);
    const nameChange = document.getElementById('nameChangeIn');
    let NewName = nameChange.value;
    // Update game name display
    if (NewName == 'Main' || NewName == "") {
        sectionSpanName.textContent = `${saveData['name']} | ${datetime}`;
        saveData['LastSaved'] = datetime;
        sectionSpanName.style.color = 'yellow';
        if (DebugMode) console.log('still default name')
    } else {
        sectionSpanName.textContent = `${NewName} | ${datetime}`;
        saveData['LastSaved'] = datetime;
        saveData['name'] = NewName;
        if (DebugMode) console.log('new name')
    }
    SaveForest[`section${NumSection}`] = saveData;
    SaveForest['section0'] = saveData;
    SaveForest.DefaultSaveData = saveData;
    localStorage.setItem('SaveForest', JSON.stringify(SaveForest));
    sessionStorage.setItem('TempLatestSave', JSON.stringify(saveData));
    if (DebugMode) console.log(`Saving game ${saveData['name']}`);
}
function loadGame(NumSection) {
    let SaveForest = JSON.parse(localStorage.getItem('SaveForest') || '{}');
    let saveData = SaveForest[`section${NumSection}`]
    if (!saveData) {
        console.warn(`No save data found for section${NumSection}`);
        return;
    }
    if (CurrentPageNumber == 1) {
        if (DebugMode) console.log('Loading game id=0', NumSection);
        removeStartUpContent();
        openSettings(1);
        clearButtonContent();
        ResetEffectBarToDefault(saveData);
        GlobalQuerySelect.Side_Menu2.innerHTML = "";
        // Call the mergeDefaultProperties function to ensure saveData has all expected properties
        mergeDefaultProperties(saveData);
        Render_Scene(saveData, true);
    }
}
// Function to delete game
function deleteGame(NumSection) {
    let SaveForest = JSON.parse(localStorage.getItem('SaveForest') || '{}');
    if (SaveForest.hasOwnProperty(`section${NumSection}`)) {
        // Remove game data from localStorage
        delete SaveForest[`section${NumSection}`];
        // Clear UI
        let gameName = document.querySelector(`#gameName${NumSection}`);
        gameName.textContent = '';
        document.querySelector(`.Section${NumSection}_load_game`).disabled = true;
        document.querySelector(`.Section${NumSection}_load_game`).classList.add('disable');

        if (DebugMode) console.log(`Deleting game ${NumSection}`);
    } else {
        console.warn(`No saved game found in section${NumSection} to delete.`);
    }
}
function mergeDefaultProperties(saveData) {
    // Define default properties with all expected properties and their default values
    let defaultPropertiesForest =  JSON.parse(localStorage.getItem('SaveForest'));
    const defaultProperties = defaultPropertiesForest.DefaultSaveData
    // If saveData does not exist, initialize it with defaultProperties
    if (!saveData) {
        saveData = { ...defaultProperties };
    }
    // Merge default properties with existing properties, but only add missing properties
    for (const prop in defaultProperties) {
        if (!(prop in saveData)) {
            saveData[prop] = defaultProperties[prop];
        } else if (typeof defaultProperties[prop] === 'object') {
            // If the property is an object (e.g., Settings), merge its properties
            for (const subProp in defaultProperties[prop]) {
                if (!(subProp in saveData[prop])) {
                    saveData[prop][subProp] = defaultProperties[prop][subProp];
                }
            }
        }
    }
}
function Side_Menu_ColapseButtonClickHandler(){
    const Side_Menu_Colapse = document.querySelector('.Side_Menu_Colapse');
    const arrowChanger = document.getElementById('arrowChanger');
    const hr = document.querySelectorAll('hr');
    const button = Side_Menu_Colapse.querySelectorAll('button');
    const SideMenus = [Side_Menu_Colapse, GlobalQuerySelect.Side_Menu2, GlobalQuerySelect.Side_Menu3, GlobalQuerySelect.Side_Menu4, GlobalQuerySelect.Side_Menu5, ...hr]
    if (GlobalQuerySelect.Side_Menu.style.width == 'auto' || GlobalQuerySelect.Side_Menu.style.width == "") {
        GlobalQuerySelect.Side_Menu.style.width = '35px';
        arrowChanger.classList.replace('thick-arrow-left', 'thick-arrow-right');
        setTimeout(() => {
            SideMenus.forEach(el => {
                el.dataset.visible = 'false';
            });            
        }, 0);
    } else {
        GlobalQuerySelect.Side_Menu.style.width = 'auto';
        arrowChanger.classList.replace('thick-arrow-right', 'thick-arrow-left');
        setTimeout(() => {
            SideMenus.forEach(el => {
                el.dataset.visible = 'true';
            });
        }, 200);
    }
}