// Utility: Formats the text for spaces and breaks (~ = double break)
function formatText(text) {
    let formatted = '';
    let spaceIndex = 0;

    for (let i = 0; i < text.length; i++) {
        let char = text[i];

        if (char === ' ') {
            formatted += ' ';
            spaceIndex++;
        } else if (spaceIndex >= 20 && (char === '.' || char === ',') && text[i + 1]) {
            formatted += char + '<br>';
            spaceIndex = 0;
        } else if (char === '~') {
            formatted += '<br><br>';
            spaceIndex = 0;
        } else {
            formatted += char;
        }
    }
    return formatted;
}
// utility: creates fade-in effect for the main content
function fadeMain() {
    const children = document.querySelectorAll("main > *");
    children.forEach((el, i) => {
        el.style.opacity = 0;
        el.style.animation = `fadeIn 0.6s ease-in-out forwards`;
        el.style.animationDelay = `${0.1 * i}s`;
    });
}
// utility: Set element Color
function setElementColor(element, elementId, defaultColor) {
    const SaveForest =  JSON.parse(localStorage.getItem('SaveForest'));
    const saveData = SaveForest['section0'];
    element.style.color = saveData.dead.isDead ? 'red' : defaultColor;
    return element.style.color;
}
// utility: Generates a unique Token
async function GenRateToken(){
    return Math.random().toString(36).substring(2, 10);
}
// utility: print immediately
async function handlePrintImmediately(element, textBlock, elementId) {
    element.innerHTML = formatText(textBlock);
    isCurrentlyPrinting[elementId] = false;
    clearCursor();
    previousText[elementId] = textBlock;
    return previousText[elementId];
}
// utility: Print Charackters Slowly
async function PrintCharSlow({ textBlock, elementId, element, speed, cursor, currentTypingToken, token, output = '', replace = { anew : false, PastText : ''}}) {
    const formattedText = formatText(textBlock);
    for (let i = 0; i < formattedText.length; i++) {
        if (currentTypingToken[elementId] !== token) {
            // If player clicked while printing
            handlePrintImmediately( element, textBlock );
            return;
        }
        let char = formattedText[i];
        output += char;
        element.innerHTML = replace.anew ? replace.PastText + output : output;
        if (cursor && element) element.appendChild(cursor); // Append cursor after each character
        // add a longer pause after dot or comma
        const delayDuration = (char === '.' || char === ',') ? 400 : speed;
        // typingSound.currentTime = 0; // Reset sound to start
        // typingSound.play().catch(() => {}); // Play typing sound
        await new Promise(resolve => setTimeout(resolve, delayDuration)); // Delay next letter
    }
    if ( cursor ) element.removeChild(cursor); // Remove cursor after typing
}
// utility: word coloring
function applyWordColoring(element, textBlock, textAndColorArray) {
    let remainingText = textBlock;
    for (let i = 0; i < textAndColorArray.word.length; i++) {
        const word = textAndColorArray.word[i];
        const color = textAndColorArray.color[i];
        const index = remainingText.indexOf(word);
        if (index !== -1) {
            element.append(document.createTextNode(remainingText.substring(0, index)));
            const span = document.createElement("span");
            span.textContent = word;
            span.style.color = color;
            element.append(span);
            remainingText = remainingText.substring(index + word.length);
        }
    }
    if (remainingText.length > 0) {
        element.append(document.createTextNode(remainingText));
    }
}
// utility: delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// utility: clear Cursor
function clearCursor() {
    document.querySelectorAll('.fake-cursor').forEach(c => c.remove());
}
function clearSpan(elementId) {
    document.querySelectorAll(`.Extra-Span-${[elementId]}`).forEach(c => c.remove());
}
// Utility: Create a fake blinking cursor
function createFakeCursor() {
    const cursor = document.createElement('span');
    cursor.classList.add('fake-cursor');
    cursor.innerHTML = '|';
    return cursor;
}
// Core Function to simulate slow typing effect for text
/*
async function addTextFullFeature({
    elementId,
    textBlock,
    textAndColorArray = {word : [], color : []}, // array of { word: string, color: string }
    speed = 200, 
    printImmediately = false, 
    replace = true,
    addSpan = false,
    tempColorDuration = 0,
    defaultColor = 'azure',
}) {
    // TODO: 1. add sound to it just start when isCurrentlyPrinting is true and it will work
    
    // Set-up Token & cursor
    const token = GenRateToken();
    let cursor;
    currentTypingToken[elementId] = token;
    // Set-up element
    const element = addSpan ? document.createElement('span') : document.querySelector(elementId);
    if(addSpan) {
        element.classList.add(`Extra-Span-${[elementId]}`);
        document.querySelector(elementId).appendChild(element);
    }

    if (replace) element.innerHTML = ''; // Clear the content for replacement
    if (!replace && previousText[elementId] !== undefined ) element.innerHTML = previousText[elementId];
    const SaveForest =  JSON.parse(localStorage.getItem('SaveForest'));
    const saveData = SaveForest['section0'];
    const PrintBoolian = (printImmediately || saveData.Settings.SlowTyping === false || ( previousText[elementId] === textBlock ))

    isCurrentlyPrinting[elementId] = true;

    // Clear old cursors
    clearCursor();
    // Set text color based on death
    setElementColor( element, elementId, defaultColor );
    
    // If the word "ALL" is found in the textAndColorArray, set the color to textBlock instead of the word
    if (textAndColorArray.word == 'ALL') element.style.color = textAndColorArray.color;
    // If printing immediately or slow typing disabled or previous typing is the same
    if (PrintBoolian) {
        handlePrintImmediately( element, textBlock, elementId );
        clearCursor();
    }
    // Handle text and color array
    if (textAndColorArray.word.length > 0 && textAndColorArray.word != 'ALL') {
        applyWordColoring( element, textBlock, textAndColorArray );
        return;
    }
    // Create Fake cursor
    if (!printImmediately) {
        cursor = createFakeCursor(); // Create a fake cursor
        if (textAndColorArray.color.length == 0) {
            element.appendChild(cursor)
            // const typingSound = new Audio('path/to/typing-sound.mp3'); // Replace with actual sound file path when implemented
        }
    }
    // Slow typing character by character
    if (!PrintBoolian) await PrintCharSlow({ textBlock, elementId, element, speed, cursor, currentTypingToken, token })
    // Typing finished, clear token
    if (currentTypingToken[elementId] === token) {
        previousText[elementId] = textBlock;
        delete currentTypingToken[elementId];
        clearSpan(elementId);
        isCurrentlyPrinting[elementId] = false;
    }
    // Reset color after a delay if tempColorDuration is greater than 0
    if(tempColorDuration > 0) setTimeout(() => element.style.color = defaultColor, tempColorDuration * 1000);
}
*/
// utility: prepareElement
function prepareElement(elementId, secondaryElementId, SpanTitle, position = { row: 0, col: 0 }) {
    const element = secondaryElementId ? document.createElement('span') : document.querySelector(elementId);
    if (position) {
        element.style.gridRow = position.row;
        element.style.gridColumn = position.col;
        element.classList.add('cell');
    }
    if(secondaryElementId) {
        SpanTitle 
        ? element.classList.add(`${SpanTitle}`)
        : element.classList.add(`Extra-Span-[${elementId}]`)
        document.querySelector(elementId).appendChild(element);
    }
    return element;
}
/**
 * Enhanced text typing function - Remake of addTextFullFeature with improved structure
 * 
 * This function provides a comprehensive text typing system with support for:
 * - Slow character-by-character typing animation
 * - Immediate text printing (skip animation)
 * - Word-specific coloring
 * - Temporary color effects
 * - Secondary element creation (spans)
 * - Integration with save system settings
 * 
 * @param {Object} params - Configuration object
 * @param {string} params.MainElementID - CSS selector for the target element (e.g., '.main_section', '#dialog')
 * @param {string[]} params.text - Array of text strings to display (currently expects single string in array)
 * @param {Object} params.options - Optional configuration settings
 * @param {Object} params.options.textAndColorArray - Word coloring configuration
 * @param {string[]} params.options.textAndColorArray.word - Array of words to color, or 'ALL' for entire text
 * @param {string[]} params.options.textAndColorArray.color - Array of colors corresponding to words
 * @param {number} params.options.speed - Typing speed in milliseconds between characters (default: 200)
 * @param {boolean} params.options.printImmediately - Skip animation and show text instantly (default: false)
 * @param {Object} params.options.Position - Position Configuration
 * @param {Object} params.options.Position.row - express the position row in a String?
 * @param {Object} params.options.Position.column - express the position column in a String?
 * @param {boolean} params.options.replace - Clear existing content before typing (default: true)
 * @param {boolean} params.options.secondaryElementId - Create a new span element instead of using main element (default: false)
 * @param {number} params.options.tempColorDuration - Duration in seconds to show temporary color before reverting (default: 0)
 * @param {string} params.options.defaultColor - Default text color (default: 'azure')
 * 
 * @example
 * // Basic usage
 * typeText({
 *     MainElementID: '.main_section',
 *     text: ['Hello, welcome to Gatsha Tower!']
 * });
 * 
 * @example
 * // With custom options
 * typeText({
 *     MainElementID: '.dialog_box',
 *     text: ['The ancient door creaks open...'],
 *     options: {
 *         speed: 100,
 *         defaultColor: 'gold',
 *         tempColorDuration: 3,
 *         textAndColorArray: {
 *             word: ['ancient', 'door'],
 *             color: ['red', 'brown']
 *         }
 *     }
 * });
 * 
 * @example
 * // Color entire text
 * typeText({
 *     MainElementID: '.warning_text',
 *     text: ['DANGER AHEAD!'],
 *     options: {
 *         textAndColorArray: {
 *             word: 'ALL',
 *             color: 'red'
 *         },
 *         printImmediately: true
 *     }
 * });
 * 
 * @example
 * // Create secondary span element
 * typeText({
 *     MainElementID: '.container',
 *     text: ['Additional information...'],
 *     options: {
 *         secondaryElementId: true,
 *         speed: 50,
 *         defaultColor: 'lightblue'
 *     }
 * });
 * 
 * @returns {Promise<void>} Promise that resolves when typing animation completes
 * 
 * @note This function integrates with the game's save system to respect user settings:
 * - Checks SaveForest.section0.Settings.SlowTyping to determine if animation should be skipped
 * - Respects SaveForest.section0.dead.isDead for text coloring (red if dead)
 * - Uses localStorage to maintain consistency across game sessions
 * 
 * @note The function handles:
 * - Token-based typing interruption (clicking to skip animation)
 * - Cursor management (fake blinking cursor during typing)
 * - Text formatting through formatText() function
 * - Previous text tracking to avoid re-typing identical content
 * 
 * @see addTextFullFeature - Original function this replaces
 * @see PrintCharSlow - Core character-by-character printing function
 * @see textAnimation - Core character printing animation function
 * @see formatText - Text formatting utility for spaces and line breaks
 */
// Remake of addTextFullFeature
async function typeText({ MainElementID, text = [], options = {} }) {
    const {
        textAndColorArray = {word : [], color : []}, // array of { word: string, color: string }
        speed = 200, 
        printImmediately = false, 
        replace = true,
        position =  { row: 0, col: 0 },
        secondaryElementId = false,
        secondaryElementIdTitle = null,
        tempColorDuration = 0,
        defaultColor = 'azure',
        TimeSettings = { totalRevealTime: 500, cycleSpeed: 25, delayPerChar: 1 }
    } = options;

    // Set-up Token & cursor
    const token = GenRateToken();
    currentTypingToken[MainElementID] = token;
    clearCursor();
    let cursor;
    let TokenSettings = { currentTypingToken, token, elementId: MainElementID};
    // Set-up element
    const el = prepareElement(MainElementID, secondaryElementId, secondaryElementIdTitle, position);
    // Set-up flag
    isCurrentlyPrinting[MainElementID] = true;
    
    // replace text or not
    if (replace) el.innerHTML = ''; // Clear the content for replacement
    if (!replace && previousText[MainElementID] !== undefined ) el.innerHTML = previousText[MainElementID];
    // set-up text
    const editedColor = setElementColor( el, MainElementID, defaultColor );
    const StringText = typeof text === "object" ? Object.values(text) : [text];
    printText({
        StringText,
        printImmediately, previousText, MainElementID, TimeSettings,
        textAndColorArray, el,
        cursor,
        editedColor, TokenSettings,
        currentTypingToken, token,
        tempColorDuration,
    });
}
// utility: printText
async function printText({
    StringText,
    printImmediately, previousText, MainElementID, TimeSettings,
    textAndColorArray, el,
    cursor,
    editedColor, TokenSettings,
    currentTypingToken, token,
    tempColorDuration, 
    }) {
    for (let textList of StringText) {
        const PrintBoolian = GetPrintBoolian(printImmediately, previousText, MainElementID, textList, TimeSettings);
        // Handle text and color array
        if (textList.length == 0) return;
        if (PrintcolorArray(textAndColorArray, el, MainElementID, textList, PrintBoolian) === true) return;
        if (!printImmediately && MainElementID === '.main_section') { cursor = createFakeCursor(); el.appendChild(cursor); }
        PrintBoolian 
        ? handlePrintImmediately( el, textList, MainElementID )
        // : await PrintCharSlow({ textBlock: textList, elementId: MainElementID, element: el, speed, cursor, currentTypingToken, token, replace })
        : await textAnimation(textList, el, editedColor, TokenSettings, TimeSettings);
        // Typing finished, clear token
        clearToken(currentTypingToken, MainElementID, token, textList);
        // Reset color after delay
        if(tempColorDuration > 0) setTimeout(() => el.style.color = editedColor, tempColorDuration * 1000);
    }
}
// utility: PrintcolorArray
function PrintcolorArray(textAndColorArray,element, elementId, text, PrintBoolian) {
    // If the word "ALL" is found in the textAndColorArray, set the color to text instead of the word
    if (textAndColorArray.word == 'ALL') element.style.color = textAndColorArray.color;
    // If printing immediately or slow typing disabled or previous typing is the same
    if (PrintBoolian) {
        handlePrintImmediately( element, text, elementId );
        clearCursor();
    }
    // Handle text and color array
    if (textAndColorArray.word.length > 0 && textAndColorArray.word != 'ALL') {
        applyWordColoring( element, text, textAndColorArray );
        return true;
    }
}
function GetPrintBoolian(printImmediately, previousText, MainElementID, textList, TimeSettings) {
    let param = ( 
        printImmediately || 
        JSON.parse(localStorage.getItem('SaveForest'))['section0'].Settings.SlowTyping === false || 
        previousText[MainElementID] === textList ||
        TimeSettings.totalRevealTime == 0
    )
    return param;
}
        
function clearToken(currentTypingToken, elementId, token, text) {
    if (currentTypingToken[elementId] === token) {
    previousText[elementId] = text;
    delete currentTypingToken[elementId];
    clearSpan(elementId);
    isCurrentlyPrinting[elementId] = false;
    return previousText && isCurrentlyPrinting;
}
}
// ------- New Text Handler Functions -------
/**
 * Text animation that displays random letters/symbols first, then transitions to correct text
 * @param {string} text - The final text to display
 * @param {HTMLElement} element - The target element
 * @param {string} color - Color for both random and final text
 * @param {Object} TokenSettings - Object containing currentTypingToken, token, and elementId
 * @param {Object} TimeSettings - Object containing duration, cycleSpeed, and delayPerChar
 */
async function textAnimation( text, element, color = 'azure',
    TokenSettings = { currentTypingToken, token, elementId: MainElementID},
    TimeSettings = { totalRevealTime, cycleSpeed, delayPerChar }) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const finalText = text;
    // Parse the text to handle HTML tags properly and create a character map
    const textMap = [];
    let visibleCharCount = 0;
    let i = 0;
    while (i < finalText.length) {
        if (finalText[i] === '<' && finalText.substring(i, i + 4) === '<br>') {
            textMap.push('<br>');
            i += 4; 
        } else if (finalText[i] === '~') {
            // Handle your custom double break character
            textMap.push('<br><br>');
            i += 1;
        } else {
            textMap.push(finalText[i]);
            i += 1;
            visibleCharCount++;
        }
    }
    
    const textLength = textMap.length;
    
    // Track which characters are revealed to prevent jumping
    const revealedChars = new Array(textLength).fill(false);
    
    function generateStableText() {
        let stableText = '';
        for (let j = 0; j < textLength; j++) {
            const char = textMap[j];
            
            if (char === ' ') {
                stableText += ' ';
            } else if (char === '<br>' || char === '<br><br>') {
                stableText += char; // Keep HTML tags as-is
            } else if (revealedChars[j]) {
                stableText += char; // Keep revealed characters static
            } else {
                // Only scramble actual letters/symbols, not spaces or HTML
                stableText += chars[Math.floor(Math.random() * chars.length)];
            }
        }
        return stableText;
    }
    
    // Set initial random text
    element.innerHTML = formatText(generateStableText());
    element.style.color = color;
    
    const startTime = Date.now();
    
    if (TokenSettings.currentTypingToken[TokenSettings.elementId] !== TokenSettings.token) {
        // If player clicked while printing
        handlePrintImmediately( element, text );
        return;
    }
    
    
    const animationInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        // Update revealed characters based on delayPerChar
        for (let k = 0; k < textLength; k++) {
            const charDelay = TimeSettings.delayPerChar * k;
            const revealTime = charDelay + TimeSettings.totalRevealTime;

            if (elapsed >= revealTime) {
                revealedChars[k] = true;
            }
        }
        const allRevealed = revealedChars.every(v => v);
        
        // Generate new text with stable revealed characters
        const newText = generateStableText();
        element.innerHTML = formatText(newText);
        element.style.color = color;
        
        // Animation complete
        if ( allRevealed) {
            clearInterval(animationInterval);
            // Ensure final text is exactly correct
            element.innerHTML = formatText(finalText);
            element.style.color = color;
        }
    }, TimeSettings.cycleSpeed);
}