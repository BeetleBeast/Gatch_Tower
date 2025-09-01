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
function applyColoring(element, text, Coloring ) {
    /*
        textAndColorArray = { word : [], color : [] }
        Coloring = {
            Onlysnipet : false,
            Color : [],
            snipet : [],
            Background : [],
            duration : [],
        },
    */
    let remainingText = text;
    for (let i = 0; i < Coloring.snipet.length; i++) {
        const word = Coloring.snipet[i];
        const color = Coloring.Color[i];
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
    const elementName = elementId.replace(/\./g, '');
    document.querySelectorAll('span',`${[elementName]}`).forEach(c => c.remove());
}
// Utility: Create a fake blinking cursor
function createFakeCursor() {
    const cursor = document.createElement('span');
    cursor.classList.add('fake-cursor');
    cursor.innerHTML = '|';
    return cursor;
}
// utility: prepareElement
function prepareElement(elementId, secondaryElement, SpanTitle, MainElementBlock, StringText) {
    const elementName = elementId.split('.');
    const MainElementBlockName = MainElementBlock?.replace(/\./g, '');

    if (elementId == '.Quest_Title' || elementId.includes('.Side-Menu')) secondaryElement = false;

    const containerSelector = MainElementBlock ? `${elementId}${MainElementBlock}` : (elementId)
    const targetElement = secondaryElement ? document.querySelector(containerSelector) : document.querySelector(elementId);

    if (!targetElement) {
        console.warn(`Element not found for selector: ${elementId}${targetElement}`);
        return null;
    }

    if(secondaryElement) {
        const spanList = [];
        for (let i = 0; i < StringText.length; i++) {
            const span = document.createElement('span');

            const dynamicClass = `span_${i}`;
            span.classList.add('Text_Lines',MainElementBlockName || '',dynamicClass);
            if (SpanTitle) span.classList.add(`${SpanTitle}`);
            targetElement.appendChild(span);
            spanList.push(span);
        }
        return spanList;
    }
    return targetElement;
}
/**
 * Enhanced Text Typing System for Gatch Tower
 * 
 * A comprehensive text animation engine that provides multiple display effects for game dialogue,
 * narrative text, and UI elements. Supports typewriter effects, fade animations, scramble effects,
 * and advanced text styling with color highlighting.
 * 
 * CORE FEATURES:
 * - Multiple animation effects: 'type', 'fade', 'scramble'
 * - Token-based interruption system (click to skip)
 * - Word-specific color highlighting
 * - Secondary element creation (dynamic spans)
 * - Save system integration for user preferences
 * - Mobile and desktop compatibility
 * 
 * INTEGRATION WITH GAME SYSTEMS:
 * - Respects SaveForest.section0.Settings.SlowTyping user preference
 * - Changes text color to red if player is dead (SaveForest.section0.dead.isDead)
 * - Maintains text history to prevent re-typing identical content
 * - Supports game's narrative branching system
 * 
 * @param {Object} config - Main configuration object
 * @param {string} config.MainElementID - CSS selector for target element (e.g., '.TextBlock', '#dialog')
 * @param {Object} config.sceneTexts - Text content and positioning
 * @param {string[]} config.sceneTexts.Lines - Array of text strings to display
 * @param {number} config.sceneTexts.Position - Element positioning (default: 'Left')
 * @param {Object} config.options - Animation and styling options
 * 
 * OPTIONS BREAKDOWN:
 * @param {boolean} config.options.printImmediately - Skip all animations, show text instantly
 * @param {boolean} config.options.replace - Clear existing content before typing (default: true)
 * @param {boolean} config.options.secondaryElement - Create new span elements instead of using main element
 * @param {string} config.options.secondaryElementTitle - CSS class for created spans
 * @param {string} config.options.MainElementBlock - Additional selector for element targeting
 * 
 * COLORING SYSTEM:
 * @param {Object} config.options.Coloring - Advanced text coloring configuration
 * @param {string[]} config.options.Coloring.Color - Colors to apply to text/words
 * @param {string[]} config.options.Coloring.Background - Background colors (future feature)
 * @param {number} config.options.Coloring.duration - Seconds to show temporary color before reverting
 * @param {boolean} config.options.Coloring.Onlysnipet - If true, only color specific words; if false, color entire text
 * @param {string[]} config.options.Coloring.snipet - Specific words to highlight when Onlysnipet is true
 * 
 * ANIMATION EFFECTS:
 * @param {string} config.options.EFFECT - Animation type: 'type' | 'fade' | 'scramble'
 *   - 'type': Classic typewriter effect, character by character
 *   - 'fade': Smooth fade-in animation
 *   - 'scramble': Random characters that resolve to final text
 * 
 * TIMING CONTROLS:
 * @param {Object} config.options.TimeSettings - Fine-grained timing control
 * @param {number} config.options.TimeSettings.totalRevealTime - Total animation duration in ms
 * @param {number} config.options.TimeSettings.cycleSpeed - Update frequency for scramble effect (ms)
 * @param {number} config.options.TimeSettings.delayPerChar - Delay between characters for type/scramble effects
 * 
 * @param {string} config.options.defaultColor - Default text color (default: 'azure')
 * 
 * @returns {Promise<void>} Resolves when all text animations complete
 * 
 * @example
 * // Basic dialogue text with typewriter effect
 * await typeText({
 *     MainElementID: '.TextBlock',
 *     sceneTexts: {
 *         Lines: ['Welcome to Gatsha Tower, brave adventurer...'],
 *         Position: 'Left'
 *     },
 *     options: {
 *         EFFECT: 'type',
 *         TimeSettings: { delayPerChar: 50 }
 *     }
 * });
 * 
 * @example
 * // Highlighted words with fade effect
 * await typeText({
 *     MainElementID: '.dialog_box',
 *     sceneTexts: {
 *         Lines: ['The ancient door glows with magical energy.']
 *     },
 *     options: {
 *         EFFECT: 'fade',
 *         Coloring: {
 *             Onlysnipet: true,
 *             snipet: ['ancient', 'magical'],
 *             Color: ['#8B4513', '#FFD700'],
 *             duration: 2
 *         }
 *     }
 * });
 * 
 * @example
 * // Emergency text with scramble effect
 * await typeText({
 *     MainElementID: '.warning_text',
 *     sceneTexts: {
 *         Lines: ['SYSTEM ERROR DETECTED!']
 *     },
 *     options: {
 *         EFFECT: 'scramble',
 *         Coloring: {
 *             Onlysnipet: false,
 *             Color: ['red']
 *         },
 *         TimeSettings: {
 *             totalRevealTime: 100,
 *             cycleSpeed: 30,
 *             delayPerChar: 2
 *         }
 *     }
 * });
 * 
 * @example
 * // Multiple text lines with secondary elements
 * await typeText({
 *     MainElementID: '.story_container',
 *     sceneTexts: {
 *         Lines: [
 *             'Chapter 1: The Beginning',
 *             'You stand before the mysterious tower...',
 *             'What will you do?'
 *         ]
 *     },
 *     options: {
 *         secondaryElement: true,
 *         secondaryElementTitle: 'story_line',
 *         EFFECT: 'type',
 *         defaultColor: 'lightblue'
 *     }
 * });
 * 
 * TECHNICAL NOTES:
 * - Uses token system to prevent animation conflicts when rapidly clicking
 * - Integrates with game's save system for user preferences
 * - Handles HTML formatting through formatText() utility
 * - Supports mobile touch events and desktop mouse/keyboard
 * - Memory efficient: cleans up tokens and cursors after animation
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Long text with scramble effect may impact performance on slower devices
 * - Consider using printImmediately: true for very long passages
 * - Secondary elements create additional DOM nodes - use sparingly for large text blocks
 * 
 * @see PrintCharSlow - Core typewriter animation engine
 * @see FadePrint - Fade animation implementation  
 * @see textAnimation - Scramble effect implementation
 * @see formatText - Text preprocessing for line breaks and spacing
 * @see prepareElement - DOM element preparation and span creation
 * 
 * @since v2.0 - Replaces legacy addTextFullFeature function
 * @author Gatch Tower Development Team ( ME , MYSELF and I )
 */
async function typeText({ 
    MainElementID, 
    sceneTexts = {},
    options : {
        printImmediately = false, 
        replace = true,

        secondaryElement = true,
        secondaryElementTitle = null,
        MainElementBlock = null,
        
        Coloring = {
            Color : [],
            Background : [],
            duration : 0,
            Onlysnipet : false,
            snipet : [],
        },
        
        defaultColor = 'azure',
        TimeSettings = { totalRevealTime: 200, cycleSpeed: 25, delayPerChar: 1 },
        EFFECT = 'fade'
    } 
}) {

    const {
        Lines = [],
        Position = 'Left',
    } = sceneTexts;

    // Set-up Token & cursor
    const TokenSettings = { 
        currentTypingToken: {[MainElementID]: ''},
        token: GenRateToken(),
        elementId: MainElementID
    };
    TokenSettings.currentTypingToken[MainElementID] = TokenSettings.token;

    clearCursor();
    let cursor;

    // Set-up element
    const StringText = typeof Lines === "object" ? Object.values(Lines) : [Lines];
    const Elements = {
        el: prepareElement(MainElementID, secondaryElement, secondaryElementTitle, MainElementBlock,StringText),
        MainElementID,
    };
    // Set-up flag
    isCurrentlyPrinting[Elements.MainElementID] = true;
    // Print text
    if (Elements.el) {
        for (let i=0;i< StringText.length;i++) {
            const textList = StringText[i];
            if (textList.length == 0) continue;
            Elements.DeltaEl;
            if (Elements.el[i]) {
                Elements.DeltaEl = Elements.el[i];
            } else if (MainElementBlock) {
                Elements.DeltaEl = document.createElement('span');
                Elements.DeltaEl.classList.add('TextBlock', `TextBlock_${i}`);
                Elements.el.appendChild(Elements.DeltaEl);
            } else {
                Elements.DeltaEl = Elements.el;
                if( replace ) Elements.el.innerHTML = '';
                // clearSpan(DeltaEl); // Clear the content for replacement
            }
            // replace text or not
            if (!replace && previousText[Elements.MainElementID] !== undefined ) Elements.DeltaEl.innerHTML = previousText[Elements.MainElementID];
            // set-up text
            const editedColor = setElementColor( Elements.DeltaEl, Elements.MainElementID, defaultColor ); // set default color or dead color
            const PrintBoolian = GetPrintBoolian(printImmediately, previousText, Elements.MainElementID, textList, TimeSettings);
            // Handle text and color array
            if ( ColoringHandler(Coloring, Elements.DeltaEl, Elements.MainElementID, textList, PrintBoolian) === true) return;
            if (!printImmediately && Elements.MainElementID === '.TextBlock' && EFFECT !== 'fade') { cursor = createFakeCursor(); DeltaEl.appendChild(cursor); }
            if (PrintBoolian) handlePrintImmediately( Elements.DeltaEl, textList, Elements.MainElementID )
            else if(EFFECT)  await PrintTextWEffect({ textList, Elements, TimeSettings, cursor, replace, TokenSettings, Position, editedColor, EFFECT });
            // Typing finished, clear token
            clearToken(TokenSettings, textList);
            // Reset color after delay
            if ( Coloring.duration > 0) setTimeout(() => Elements.DeltaEl.style.color = editedColor, Coloring.duration * 1000);
        }
    }
}
// ---- utility -----
// utility: PrintTextWEffect 
async function PrintTextWEffect({
    textList, Elements, TimeSettings, cursor, replace,
    TokenSettings, Position,
    editedColor, EFFECT
}) {
    if ( EFFECT === 'type') await PrintCharSlow({ textList, TokenSettings, element: Elements.DeltaEl, speed: TimeSettings, cursor, replace });
    if ( EFFECT === 'fade') await FadePrint( Elements.DeltaEl, textList, TimeSettings, TokenSettings, Position );
    if ( EFFECT === 'scramble') await textAnimation(textList, Elements.DeltaEl, editedColor, TokenSettings, TimeSettings);
}
// utility: ColoringHandler
function ColoringHandler(Coloring, element, MainElementID, textList, PrintBoolian) {
    if(!Coloring.Onlysnipet) {
        element.style.color = Coloring.Color[0];
    } else if ( PrintBoolian) {
        // If printing immediately or slow typing disabled or previous typing is the same
        handlePrintImmediately( element, textList, MainElementID );
        clearCursor();
    } else if (Coloring.snipet.length > 0 && Coloring.Onlysnipet) {
        applyColoring( element, textList, Coloring );
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
        
function clearToken(TokenSettings, text) {
    if (TokenSettings.currentTypingToken[TokenSettings.elementId] === TokenSettings.token) {
    previousText[TokenSettings.elementId] = text;
    delete TokenSettings.currentTypingToken[TokenSettings.elementId];
    isCurrentlyPrinting[TokenSettings.elementId] = false;
    return previousText && isCurrentlyPrinting;
}
}
// utility: clearText and clearButtonText
function clearText() {
    document.querySelectorAll('.TextBlock').forEach(el => {
        el.textContent = ''
    });
}
function clearButtonText() {
    document.querySelectorAll('.Choices').forEach(el => {
        el.innerHTML = '';
    });
}
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
/**
 * Prints text character by character with a typewriter effect
 * @param {Object} params - Configuration object for the typing animation
 * @param {string} params.textBlock - The text content to be typed out
 * @param {string} params.elementId - Unique identifier for the target element
 * @param {HTMLElement} params.element - The DOM element where text will be displayed
 * @param {number} params.speed - Base delay in milliseconds between each character
 * @param {HTMLElement} params.cursor - Optional cursor element to show typing position
 * @param {Object} params.currentTypingToken - Token tracking object to manage typing interruptions
 * @param {string} params.token - Unique token for this specific typing session
 * @param {string} params.output - Accumulated output string (default: empty string)
 * @param {Object} params.replace - Configuration for text replacement behavior
 * @param {boolean} params.replace.anew - Whether to append to existing text or replace entirely
 * @param {string} params.replace.PastText - Previous text to preserve when appending
 */
async function PrintCharSlow({ textList, TokenSettings, element, speed, cursor, output = '', replace = { anew : false, PastText : ''}}) {
    const formattedText = formatText(textList);
    for (let i = 0; i < formattedText.length; i++) {
        if (TokenSettings.currentTypingToken[TokenSettings.elementId] !== TokenSettings.token) {
            // If player clicked while printing
            handlePrintImmediately( element, textList );
            return;
        }
        let char = formattedText[i];
        output += char;
        element.innerHTML = replace.anew ? replace.PastText + output : output;
        if (cursor && element) element.appendChild(cursor); // Append cursor after each character
        // add a longer pause after dot or comma
        const delayDuration = (char === '.' || char === ',') ? 400 : speed.delayPerChar;
        // typingSound.currentTime = 0; // Reset sound to start
        // typingSound.play().catch(() => {}); // Play typing sound
        await new Promise(resolve => setTimeout(resolve, delayDuration)); // Delay next letter
    }
    if ( cursor ) element.removeChild(cursor); // Remove cursor after typing
}
/**
 * Displays text with a smooth fade-in animation effect as an alternative to typewriter typing.
 * Integrates with the game's token system for click-to-skip functionality and supports 
 * element positioning for dialogue systems.
 * 
 * @param {HTMLElement} el - Target DOM element to animate
 * @param {string} textList - Raw text content to display and animate
 * @param {string} MainElementID - CSS selector/ID for the target element (e.g., '.TextBlock')
 * @param {Object} TimeSettings - Animation timing configuration
 * @param {number} TimeSettings.totalRevealTime - Delay before animation starts in milliseconds (default: 200)
 * @param {Object} TokenSettings - Token system for interruption handling
 * @param {Object} TokenSettings.currentTypingToken - Global token tracking object
 * @param {string} TokenSettings.token - Unique token for this animation session
 * @param {number|string} Position - Element positioning value for parent container (default: 'Left')
 *   - String: Sets data-position attribute on parent element
 *   - 'default': Skips positioning entirely
 * 
 * @returns {Promise<string|undefined>} Resolves to the cached text content when animation completes
 * 
 * @see formatText - Text preprocessing for spacing and line breaks
 * @see handlePrintImmediately - Instant text display for interruptions
 * @see clearCursor - Cleanup utility for cursor elements
 * @see typeText - Main text animation controller that calls this function
 * 
 * @since v2.0 - Part of enhanced text animation system
 * @author Gatch Tower Development Team
 */
async function FadePrint( 
    el, textList,
    TimeSettings = { totalRevealTime : 200} ,
    TokenSettings = { currentTypingToken, token, MainElementID },
    Position = 'Left'
    ) {
    clearCursor();
    const formattedText = formatText(textList);

    el.style.opacity = 0;
    el.offsetHeight = 'undefined';
    if (el) el.innerHTML = formattedText;
    if ( Position != 'default') el.parentElement.dataset.position = Position;
    // Apply animation
    
    el.style.animation = `${600}ms linear ${TimeSettings.totalRevealTime}ms 1 normal forwards running fadeIn`;


    if (TokenSettings.currentTypingToken[TokenSettings.MainElementID] !== TokenSettings.token) {
        // If player clicked while printing
        handlePrintImmediately( el, textList );
        return;
    }

    // Wait for animation to finish
    await new Promise(resolve => setTimeout(resolve, TimeSettings.totalRevealTime));

    if (isCurrentlyPrinting) isCurrentlyPrinting[MainElementID] = false;
    if (previousText) previousText[MainElementID] = textList;
    return previousText?.[MainElementID];
};
function CustomText(inputObj, variables = {}, returnType = String) {
    const result = {};
    for (const [key, value] of Object.entries(inputObj)) {
        const match = typeof value === 'string' && value.match(/\$\{(\w+)\}/g);
        if (match) {
        let replaced = value;
        match.forEach(m => {
            const varKey = m.slice(2, -1); // remove ${ and }
            const val = variables[varKey];
            replaced = replaced.replace(m, val !== undefined ? val : '');
        });
        result[key] = (typeof returnType == Number) ? Number(replaced) : replaced;
        } else {
        result[key] = value;
        }
    }
    return result;
}
