// HtmlContentInjector.js
// Function to create the initial elements and content for the game
function StartUp_Content() {
    const main = document.querySelector('.choices_section'); // changed .main to .app
    const startParentParent = document.createElement('div');
    const startParent = document.createElement('div');
    const continueBtn = document.createElement('button');
    const newGameBtn = document.createElement('button');
    const loadGameBtn = document.createElement('button');
    const settingsBtn = document.createElement('button');

    startParentParent.classList.add('startParentParent');

    startParent.classList.add('startParent');
    startParent.dataset.visible = 'true';
    
    continueBtn.classList.add('startscreen');
    continueBtn.textContent = 'Continue';
    continueBtn.id = 'Continue-Game';
    continueBtn.type = 'button';
    continueBtn.addEventListener('click', () => startup(1));

    
    newGameBtn.classList.add('startscreen');
    newGameBtn.textContent = 'start';
    newGameBtn.id = 'NewGame';
    newGameBtn.type = 'button';
    newGameBtn.addEventListener('click', () => startup(2));
    
    loadGameBtn.classList.add('startscreen');
    loadGameBtn.textContent = 'load';
    loadGameBtn.id = 'LoadGame';
    loadGameBtn.type = 'button';
    // loadGameBtn.addEventListener('click', () => SettingsOverlay(1));

    settingsBtn.classList.add('startscreen');
    settingsBtn.textContent = 'settings';
    settingsBtn.id = 'Settings';
    settingsBtn.type = 'button';
    // settingsBtn.addEventListener('click', () => SettingsOverlay(3));


    startParent.append( continueBtn, newGameBtn, loadGameBtn, settingsBtn );
    startParentParent.appendChild(startParent);
    main.appendChild(startParentParent);

    GlobalQuerySelect.startScreen = document.querySelector('.startParent');

    SetLoadingScreen(false)
    return GlobalQuerySelect;
}
function Side_Menu(Influences, GlobalQuerySelect) {
    const Side_Menu = document.querySelector('#Side-Menu');
    const Side_Menu_ColapseButton = document.createElement('button')
    const arrowChanger = document.createElement('div')

    const Side_Menu1 = document.createElement('div');
    const Side_image = document.createElement('div');
    const Side_Title = document.createElement('div');

    const Side_Menu1_1 = document.createElement('div');
    const Side_Menu2 = document.createElement('div');
    const Side_Menu3 = document.createElement('div');
    const Side_Menu4 = document.createElement('div');

    const Side_Menu5 = document.createElement('div');

    Side_Menu_ColapseButton.title = 'Toggle the UI bar';
    Side_Menu_ColapseButton.ariaLabel = 'Toggle the UI bar';
    Side_Menu_ColapseButton.type = 'button';
    Side_Menu_ColapseButton.id = 'Side-Menu_ColapseButton';

    arrowChanger.classList.add('thick-arrow-left');
    arrowChanger.id = 'arrowChanger';

    Side_Menu1.classList.add("Side-Menu_Class", "Side_Menu_Colapse");
    Side_Menu1.id = 'Side-Menu1';
    Side_image.id = 'Side-image';
    Side_image.classList.add("Side-Menu_Class", "Side_Menu_Colapse");
    Side_Title.id = 'Side-Title';
    Side_Title.classList.add("Side-Menu_Class", "Side_Menu_Colapse");
    Side_Title.innerHTML = 'Gacha Tower';

    Side_Menu1_1.classList.add("Side-Menu1-1", "Side-Menu_Class", "Side_Menu_Colapse");
    Side_Menu2.classList.add("Side-Menu2", "Side-Menu_Class", "Side_Menu_Colapse");
    Side_Menu3.classList.add("Side-Menu3", "Side-Menu_Class", "Side_Menu_Colapse");

    Side_Menu4.classList.add("Side-Menu4", "Side-Menu_Class", "Side_Menu_Colapse");
    //Side_Menu4.dataset.visible = false;
    for (let i = 0; i <= Influences.length;i++) {
        const el = document.createElement('div');
        const span = document.createElement('span');
        const el2 = document.createElement('div');
        const el3 = document.createElement('div');
        el.classList.add("Side-Influences_Title", "Side-Menu_Class", "Side_Menu_Colapse", "InfluencesAll");
            span.classList.add(`${Influences[i]}Title`, "Side-Menu_Class", "Side_Menu_Colapse");
        el2.classList.add("Side-Influences", "Side-Menu_Class", "Side_Menu_Colapse", "InfluencesAll");
            el3.classList.add("Side-Influences_Bar", Influences[i], "Side-Menu_Class", "Side_Menu_Colapse", "InfluencesAll");
        el2.appendChild(el3);
        el.appendChild(span);
        Side_Menu4.append(el, el2);
    }
    Side_Menu5.classList.add("Side-Menu5", "Side-Menu_Class", "Side_Menu_Colapse");

    const Settings = document.createElement('div');
    Settings.classList.add("bottom-links", "Side-Menu_Class", "Side_Menu_Colapse");

    const SettingsLOW = document.createElement('div');
    SettingsLOW.classList.add("SettingsLOW", "Side-Menu_Class", "Side_Menu_Colapse")

    const BtnSettings = document.createElement('button');
    BtnSettings.classList.add("BtnSettings", "settings", "Side-Menu_Class", "Side_Menu_Colapse");
    BtnSettings.textContent = 'settings';
    

    const BtnLoad = document.createElement('button');
    BtnLoad.classList.add("BtnLoad", "settings", "Side-Menu_Class", "Side_Menu_Colapse");
    BtnLoad.textContent = 'saves';
    

    const BtnInfo = document.createElement('button');
    BtnInfo.classList.add("BtnInfo", "settings", "Side-Menu_Class", "Side_Menu_Colapse")
    BtnInfo.textContent = 'Info';
    

    SettingsLOW.appendChild(BtnInfo);
    Settings.append(BtnSettings, BtnLoad);
    Side_Menu5.append(Settings, SettingsLOW, document.createElement('br'));


    Side_Menu_ColapseButton.appendChild(arrowChanger);
    Side_Menu1.append(Side_image, Side_Title, document.createElement('br'));
    Side_Menu1_1.appendChild(document.createElement('br'));
    Side_Menu.append( Side_Menu_ColapseButton, document.createElement('br'), Side_Menu1, document.createElement('hr'), Side_Menu1_1, Side_Menu2, document.createElement('hr'), Side_Menu3, document.createElement('hr'), Side_Menu4, Side_Menu5);

    GlobalQuerySelect.Side_Menu = document.querySelector('.Side-Menu_Class');   //  influences  (Bar)
    GlobalQuerySelect.Side_Menu2 = document.querySelector('.Side-Menu2');   //  Character list  (in words)
    GlobalQuerySelect.Side_Menu3 = document.querySelector('.Side-Menu3');   //  effects    (Debuff)
    GlobalQuerySelect.Side_Menu4 = document.querySelector('.Side-Menu4');   //  influences  (Bar)
    GlobalQuerySelect.Side_Menu5 = document.querySelector('.Side-Menu5');   //  Extra buttons
    GlobalQuerySelect.Side_MenuClass = document.querySelector('.InfluencesAll')
    GlobalQuerySelect.BtnInfo = document.querySelector('.BtnInfo');
    GlobalQuerySelect.BtnLoad = document.querySelector('.BtnLoad');
    GlobalQuerySelect.BtnSettings = document.querySelector('.BtnSettings');
    GlobalQuerySelect.PainBar = document.querySelector('.Pain');    //  width: 1%;
    GlobalQuerySelect.FatigueBar = document.querySelector('.Fatigue');  //  width: 1%;
    GlobalQuerySelect.FearBar = document.querySelector('.Fear');    //  width: 1%;
    GlobalQuerySelect.StressBar = document.querySelector('.Stress');    //  width: 1%;
    GlobalQuerySelect.TraumaBar = document.querySelector('.Trauma');    //  width: 1%;
    GlobalQuerySelect.AddictionBar = document.querySelector('.Addiction');  //  width: 1%;
    GlobalQuerySelect.SicknessBar = document.querySelector('.Sickness');    //  width: 1%;
    GlobalQuerySelect.BleedBar = document.querySelector('.Bleed');  //  width: 1%;
    GlobalQuerySelect.ControlBar = document.querySelector('.Control');  //  width: 100%;
    GlobalQuerySelect.ControlTitle = document.querySelector('.ControlTitle');
    GlobalQuerySelect.Side_Influences_Title = document.querySelector('.Side-Influences_Title');
    GlobalQuerySelect.Side_Menu_ColapseButton = document.getElementById('Side-Menu_ColapseButton');
    return GlobalQuerySelect;
}
function Title_Section(GlobalQuerySelect) {
    const app = document.querySelector('.app');
    const Title = document.querySelector('.Title');
    const Quest_Title = document.createElement('div');
    Quest_Title.classList.add('Quest_Title');
    Title.appendChild(Quest_Title);

    GlobalQuerySelect.Title = document.querySelector('.Quest_Title');
    return GlobalQuerySelect;
}
function Main_Section_Content(GlobalQuerySelect) {
    const app = document.querySelector('.app');

    const main = document.createElement('div');
    const main_section = document.createElement('div');
    const choices_section = document.createElement('div');
    const choices_section_title = document.createElement('div');
    const br = document.createElement('br');
    const choices_section_choices = document.createElement('div');


    const BtnElements = [];
    for ( let i = 1; i <= 7; i++) {
        const el = document.createElement('div');
        el.classList.add('Choices', `Sh_${i}`);
        BtnElements.push(el);
    }
    choices_section_choices.classList.add('choices_section_choices');
    choices_section_title.classList.add('choices_section_title');
    choices_section.classList.add('choices_section');
    main_section.classList.add('main_section');
    main.classList.add('main');
    

    choices_section_choices.append( ...BtnElements );
    choices_section.append( choices_section_title, br, choices_section_choices );
    main.append( main_section, choices_section);
    app.appendChild( main );

    
    GlobalQuerySelect.app = document.querySelector('.app');
    GlobalQuerySelect.main_section = document.querySelector('.main_section');
    GlobalQuerySelect.choices_section_title = document.querySelector('.choices_section_title');
    GlobalQuerySelect.choices_section = document.querySelectorAll('.choices_section');
    GlobalQuerySelect.Button_Choice1 = document.querySelector('.Sh_1');
    GlobalQuerySelect.Button_Choice2 = document.querySelector('.Sh_2');
    GlobalQuerySelect.Button_Choice3 = document.querySelector('.Sh_3');
    GlobalQuerySelect.Button_Choice4 = document.querySelector('.Sh_4');
    GlobalQuerySelect.Button_Choice5 = document.querySelector('.Sh_5');
    GlobalQuerySelect.Button_Choice6 = document.querySelector('.Sh_6');
    GlobalQuerySelect.Button_Choice7 = document.querySelector('.Sh_7');
    return GlobalQuerySelect;
}
function Inventory_Content(amountOfPages = 0) {
    const Inventory = document.querySelector('.Inventory');
    const inventoryContainer = document.createElement('div');
    if ( Inventory.hasChildNodes(inventoryContainer) ) return;
    const pages = document.createElement('div');
    const pageElements = [];
    for ( let i = 1; i <= amountOfPages; i++) {
        const el = document.createElement('div');
        el.classList.add('page', `page${i}`);
        pageElements.push(el);
    }
    pages.classList.add('pages');
    inventoryContainer.classList.add('inventoryContainer');
    inventoryContainer.style.display = 'none';

    pages.append( ...pageElements );
    inventoryContainer.appendChild( pages );
    Inventory.appendChild( inventoryContainer );
    console.log('Inventory.hasChildNodes',Inventory.hasChildNodes(inventoryContainer))

    GlobalQuerySelect.Inventory = inventoryContainer;
    GlobalQuerySelect.inventoryItem = document.querySelector('.inventoryItem');
    return GlobalQuerySelect;
}
/**
 * 
 */
function SettingsOverlay(number = null) {
    if (!number || number === null) {
    console.error('no number given.');
    return;
    }
    const GrandParent = document.querySelector('.Side-extra');
    const isVisible = GrandParent.dataset.visible === 'true';
    let parent = document.createElement('div');
    let parentDeath_Flag = false;
    const existingsChild = GrandParent.querySelector('.parent');
    switch(number) {
        case 1:
            // saves
            
            if ( !existingsChild) {
                parent.classList.add('parentLoad', 'Side-extra', 'parent', 'isvisible');
                GrandParent.dataset.visible = 'true';
                parent.append( ...Load_Content() )
            } else {
                existingsChild.remove()
                parentDeath_Flag = true;
                GrandParent.dataset.visible = 'false';
            }
            break;
        case 2:
            // Info
            if ( !existingsChild) {
                parent.classList.add('parent_Info', 'Side-extra', 'parent', 'isvisible');
                GrandParent.dataset.visible = 'true';
                parent.append( ...Info_Content() )
            } else  {
                existingsChild.remove()
                parentDeath_Flag = true;
                GrandParent.dataset.visible = 'false';
            }
            break;
        case 3:
            // Settings
            if ( !existingsChild) {
                parent.classList.add('parent_Settings', 'Side-extra', 'parent', 'isvisible');
                GrandParent.dataset.visible = 'true';
                parent.append( ...Settings_Content() )
                // Add event listener for RestartGame click
                GlobalQuerySelect.RestartGame.addEventListener("click", ResetFileClickHandler);
                GlobalQuerySelect.RestartGame.setAttribute('data-listener-added', 'true');
                // Remove event listener for RestartGame click
                GlobalQuerySelect.RestartGame.removeEventListener("click", ResetFileClickHandler);
                GlobalQuerySelect.RestartGame.removeAttribute('data-listener-added');
            } else  {
                existingsChild.remove()
                parentDeath_Flag = true;
                GrandParent.dataset.visible = 'false';
            }
            break;
    }
    console.log('SettingsOverlay : ',number);
    if (!parentDeath_Flag) {
        GrandParent.appendChild(parent);
        if(GrandParent.querySelector('.parentLoad')) LoadedSaves()
    }
    return GlobalQuerySelect;
}
function Load_Content() {
    const Load_Elements = [];

    const tabletable = document.createElement('table');
    tabletable.classList.add('tabletable');
    const caption = document.createElement('caption');
    const Allsection = document.createElement('tbody');
    Allsection.classList.add('Allsection');
    const sectionNULL = document.createElement('tr');
    sectionNULL.classList.add('sectionNULL', 'trSectionHead');

    const Num1Head = document.createElement('th');
    Num1Head.classList.add('Num1');
    const HashTagNum = document.createElement('h5');
    HashTagNum.textContent = '#';
    Num1Head.appendChild(HashTagNum)
    const SaveGameH = document.createElement('th');
    SaveGameH.classList.add('SaveGameH');
    SaveGameH.textContent = 'Save';
    const load_gameSH = document.createElement('th');
    load_gameSH.classList.add('load_gameSH');
    load_gameSH.textContent = 'load';
    const Th_NameH = document.createElement('th');
    Th_NameH.classList.add('Th_NameH');
    Th_NameH.textContent = 'ID / Name';
    const Del_gameH = document.createElement('th');
    Del_gameH.classList.add('Del_gameH');
    Del_gameH.textContent = 'Delete';
    sectionNULL.append(Num1Head, SaveGameH, load_gameSH, Th_NameH, Del_gameH)
    Allsection.appendChild(sectionNULL)
    for ( let i = -1; i <= 4;i++) {
        const el = document.createElement('tr');
        const Num1 = document.createElement('td');
        Num1.classList.add('Num1');
        const Num1Text = document.createElement('h5');

        const SaveGame = document.createElement('td');
        const load_gameS = document.createElement('td');
        const Th_Name = document.createElement('td');
        const Del_game = document.createElement('td');
        
        
        if ( i === -1 ) {
            el.classList.add('section_Latest', 'trSection');
            Num1Text.classList.add('Numberchanger');
            Num1Text.textContent = 'A';
            SaveGame.classList.add('SaveGame');
            el.append()
            
            
        } else {
            el.classList.add(`section${i}`, 'trSection');
            Num1Text.classList.add('Numberchanger');
            Num1Text.textContent = i+1;
            SaveGame.classList.add('SaveGame');
            const SaveGameBtn = document.createElement('button');
            SaveGameBtn.type = 'button';
            SaveGameBtn.classList.add('Section0_Save_Game', 'BtnTable')
            SaveGameBtn.onclick = () => saveGame(i+1);
            SaveGameBtn.textContent = 'Save Game';
            SaveGame.appendChild(SaveGameBtn);
            el.append()
        }
        Num1.appendChild(Num1Text);
        
        load_gameS.classList.add('load_gameS');
        const load_gameSBtn = document.createElement('button');
        load_gameSBtn.type = 'button';
        load_gameSBtn.classList.add(`Section${i+1}_load_game`, 'load_gameS', 'BtnTable');
        load_gameSBtn.onclick = () => loadGame(i+1);
        load_gameSBtn.textContent = 'load Game';
        load_gameS.appendChild(load_gameSBtn);
        
        Th_Name.classList.add('Th_Name');
        const Th_NameSpan = document.createElement('span');
        Th_NameSpan.classList.add(`Section${i === -1 ? '00' : i+1}_Name`, `SpanSName${i+1}`);
        Th_NameSpan.id = `gameName${i+1}`;
        Th_NameSpan.textContent = 'Latest-Game';
        Th_Name.appendChild(Th_NameSpan);
        
        Del_game.classList.add('Del_game');
        const Del_gameBtn = document.createElement('button');
        Del_gameBtn.type = 'button';
        Del_gameBtn.classList.add(`Section${i === -1 ? '00' : i}_Del_G`, 'BtnTable', 'DEl');
        Del_gameBtn.onclick = () => deleteGame(i+1);
        Del_gameBtn.textContent = 'Delete Game';
        Del_game.appendChild(Del_gameBtn);

        el.append(Num1, SaveGame, load_gameS, Th_Name, Del_game)
        Allsection.appendChild(el)
    }
    const el = document.createElement('tr');
    el.classList.add('sectionSetting');
    const td = document.createElement('td');
    td.classList.add('nameChangeTitle');
    const form = document.createElement('form');
    form.classList.add('nameChange');
    form.noValidate = true;
    const label = document.createElement('label');
    label.htmlFor = 'nameChangeIn';
    const labelP = document.createElement('p');
    labelP.classList.add('nameChangeLabel');
    labelP.textContent = 'Change save name to:';
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'nameChangeIn';
    input.name = 'nameChangeIn';
    input.placeholder = 'Main';
    input.pattern = "[A-Za-z0-9]";

    label.appendChild(labelP);
    form.append(label, input);
    td.appendChild(form);
    el.appendChild(td);

    const el2 = document.createElement('tr');
    el2.classList.add('sectionSetting');
    const td1 = document.createElement('td');
    const td2 = document.createElement('td');
    const td3 = document.createElement('td');
    td1.classList.add('pagesLG');
    td2.classList.add('pagesLG');
    td3.classList.add('pagesLG');
    const td1_Btn = document.createElement('button');
    const td2p = document.createElement('p');
    const td3_Btn = document.createElement('button');
    td1_Btn.type = 'button';
    td1_Btn.classList.add('Btn-pages-back', 'Btn-backforward', 'thick-arrow-left-SG');
    td1_Btn.title = 'back btn';
    td2p.classList.add('Num1');
    td2p.textContent = 'page';
    const td2pSpan = document.createElement('span');
    td2pSpan.classList.add('pageNum', 'Num1');
    td2pSpan.textContent = '1';
    td3_Btn.type = 'button';
    td3_Btn.classList.add('Btn-pages-forward', 'Btn-backforward', 'thick-arrow-right-SG')
    td3_Btn.title = 'forward btn';

    td2p.appendChild(td2pSpan);
    td1.appendChild(td1_Btn);
    td2.appendChild(td2p);
    td3.appendChild(td3_Btn);
    el2.append(td1, td2, td3);

    Allsection.append(el,el2);
    tabletable.append(caption, Allsection)
    Load_Elements.push(tabletable)

    GlobalQuerySelect.nameChangeIn = input;

    return Load_Elements;
}
function Info_Content() {
    const Info_Elements = [];
    return Info_Elements;
}
function Settings_Content() {
    const Settings_Elements = [];
    const ResetBtn = document.createElement('button');
    ResetBtn.type = 'button';
    ResetBtn.id = 'Reset';
    ResetBtn.onclick = () => ResetFileClickHandler();
    ResetBtn.classList.add('Side-extra', 'Restart', 'Button');
    ResetBtn.textContent = 'Restart game';
    Settings_Elements.push(ResetBtn);

    GlobalQuerySelect.RestartGame = ResetBtn;
    return Settings_Elements;
}


// Function to create and show a spinning loader
function showLoader() {
    // Create loader container
    const loaderContainer = document.createElement('div');
    loaderContainer.id = 'gameLoader';
    loaderContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;

    // Create spinner element
    const spinner = document.createElement('div');
    spinner.style.cssText = `
        width: 50px;
        height: 50px;
        border: 5px solid #333;
        border-top: 5px solid #fff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    loaderContainer.appendChild(spinner);
    document.body.appendChild(loaderContainer);
}
// Function to hide the loader
function hideLoader() {
    const loader = document.getElementById('gameLoader');
    if (loader) {
        loader.remove();
    }
}