# Buttons and there implementations

- ButtonNumber: 1,  <= tells it the position relative to other buttons.
- ButtonText: 'Run' <= the text on the button
- Position: 'Bottom' <= the position of the button.
    ^( not ready yet as it is not yet clear how to implement).
- next_scene: 'end' <= the scene to go to after the button is pressed.
    ^( if it is not specified, the scene will go to the next scene in numerical order)
        ^( if DeadEnd OR false is specified, the scene will not change BUT in DeadEnd no action will also be taken).
- action : [
    {
    type: 'rested',
    value: '10',
    },{
    type: 'DeBuffParentFunction',
    effect: 'Pacified',
    strength: '20',
    target: '.BtnBlock'
    },{
    type: 'DeBuffParentFunction',
    effect: 'Confusion',
    strength: '20',
    target: '.BtnBlock'
    }] <= the actions that will be performed after the button is pressed.
    ^( type is the type of action it will perform)
        ^(value & strength are values the action will take depending on what the type is)
        ^(effect is the Type Effect the action will take)
        ^(target is the element where the action will be visible).
^(if the action is not specified, no action will be activated for the button).

- Duration: 0:01 <= the duration of the action in hours:minutes.
^( if the duration is not specified, the duration will not be visible).
    ^( not yet implemented )
- Interest: Cave <= the place of interest of the button.
^( if the interest is not specified, the interest will not be visible).
    ^( not yet implemented )

## Types of actions: ( sorted via order in ActionEffectHandlers.js )

- characterMaker
- rested
- BuffParentFunction
  - effectHandlers:
    - Blinded
    - pacified
    - Confusion
    - Weakened ( not yet implemented )
    - Slowed ( not yet implemented )
    - Silenced ( not yet implemented )
    - Crippled ( not yet implemented )
    - Vulnerable ( not yet implemented )
    - Disarmed ( not yet implemented )
    - Diseased ( not yet implemented )
    - Fear ( not yet implemented )
    - Stunned ( not yet implemented )
    - Hexed ( not yet implemented )
    - Drained ( not yet implemented )
    - Sapped ( not yet implemented )
    - Marked ( not yet implemented )
    - Burning ( not yet implemented )
    - Chilled ( not yet implemented )
    - Rooted ( not yet implemented )
    - Cursed ( not yet implemented )
    - Fatigue ( not yet implemented )
    - MAXeffect ( not yet implemented )
- createElement
- manageHiddenInfo
- damageAndDeath

### manageHiddenInfo

- show: String <=( if true the element will be shown until [e], then be hidden)
- textID: Number <=( the same ID used in [Uncovered.HiddenText] will be the text inside [ALT_Text.Hidden] )
- Btn: [{
    -BtnID Number <=( the same ID used in [Uncovered.HiddenButton] see more ^here )
    -IsVisible
    }]
- itemID: Number <=( the same ID used in [Uncovered.Items] )

[[^here]] <=(
    HiddenButton has three Objects:
    - BtnID: 2,  <= the same ID used in Above
    - Show: false, <= if true the button will be shown until [e], then be hidden
    - sceneID: 16, the sceneID were it is used in )
