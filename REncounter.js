// REncounter.js
function tryRandomEncounter(Testing= false) {
    let saveData = JSON.parse(sessionStorage.getItem('TempLatestSave'));

    const events = Testing ? 
        Object.values(saveData.RandomEvent) : 
        Object.values(saveData.RandomEvent).slice(1); // skip test (0)

    const currentScene = parseScene(saveData.currentScene);

    // Filter events available at current site
    const possibleEvents = events.filter(event => {
    return event.sites.some(site => {
        if (site === "ALL") return true;

        const match = site.match(/^([<>]=?)(\d+)_(\d+)$/);
        if (match) {
            const operator = match[1];
            const scene = parseScene(`${match[2]}_${match[3]}`);
            const cmp = compareScenes(currentScene, scene);

            switch (operator) {
                case '<':  return cmp === -1;
                case '<=': return cmp <= 0;
                case '>':  return cmp === 1;
                case '>=': return cmp >= 0;
            }
        }

        // Direct match
        return site === saveData.currentScene;
    });
    });

    if (possibleEvents.length === 0) return false; // No events for this site

    // Total weight calculation
    const totalChance = possibleEvents.reduce(
        (sum, ev) => sum + (ev.chance ?? 1),
        0
    );

    const addNullEvent = totalChance < 1;

    // Add a "null" event if there's remaining chance (i.e., possibility nothing is picked)
    const allEvents = [...possibleEvents];
    if (addNullEvent) {
        allEvents.push({
            Name: "NoEvent",
            chance: 1 - totalChance,
            allow_multiple_event: false,
            sceneTexts: {},
        });
    }

    const chosenEvent = pickRandomWeighted(allEvents);
    if ( !chosenEvent || chosenEvent.Name === "NoEvent") return false;

    if (!chosenEvent.allow_multiple_event) {
        triggerRandomEvent(chosenEvent);
    } else {

        const remainingEvents = possibleEvents.filter(ev => ev !== chosenEvent);
        const chosenSecondEvent = pickRandomWeighted(remainingEvents);
        if ( !chosenSecondEvent || chosenSecondEvent.Name === "NoEvent") {
            triggerRandomEvent(chosenEvent);
        } else {
            triggerRandomEvent([chosenEvent, chosenSecondEvent]);
        }
    }
    return false;
}
function parseScene(sceneStr) {
    const [major, minor] = sceneStr.split('_').map(Number);
    return { major, minor };
}

function compareScenes(a, b) {
    // a < b  => -1, a == b => 0, a > b => 1
    if (a.major < b.major) return -1;
    if (a.major > b.major) return 1;
    if (a.minor < b.minor) return -1;
    if (a.minor > b.minor) return 1;
    return 0;
}
function pickRandomWeighted(events) {
    const weighted = events.flatMap(event => {
        const weight = event.chance ?? 1;
        return weight > 0 ? [{ event, weight }] : [];
    });

    const totalWeight = weighted.reduce((sum, { weight }) => sum + weight, 0);
    const rand = Math.random() * totalWeight;

    let cumulative = 0;
    for (const { event, weight } of weighted) {
        cumulative += weight;
        if (rand <= cumulative) return event;
    }

    return null; // fallback
}

function triggerRandomEvent(event) {
    let saveData = JSON.parse(sessionStorage.getItem('TempLatestSave'));
    if(Array.isArray(event)) {
        for (const Name of event){
            console.log( Name.sceneTexts.Lines);
            console.log(`\n Encounter: ${ Name.Name}`);
        }
    } else {
        console.log( event.sceneTexts.Lines);
        console.log(`\n Encounter: ${ event.Name}`);
    }


    // Add the text to the page

    const currentTitle = saveData.scenes[saveData.currentScene].chapterTitle;
    const currentSceneText = saveData.scenes[saveData.currentScene].sceneText;
    
    if(event.allow_original_scene) {
        typeText({
            MainElementID : '.Quest_Title',
            text : currentTitle,
        })
    }
    // first event then normal scene text
    let eventList = [];
    eventList.push(event);
    for (const scene of eventList) {
        typeText({
            MainElementID : '.main_section',
            text : scene.sceneTexts.Lines,
            options: {
                position: scene.sceneTexts.Position,
                printImmediately: false,
                tempColorDuration:  1,
                secondaryElementId : true,
                replace: true,
                textAndColorArray : { word : 'ALL', color : 'blue'},
            }
        })
    }
    if ( event.allow_original_scene ) {
        typeText({
            MainElementID : '.main_section',
            text : '~'+currentSceneText,
            options: {
                printImmediately: true,
                secondaryElementId : false
            }
        })
    }
    
    // add the buttons to the page
    ButtonRender( false, event)
    return true;
}
