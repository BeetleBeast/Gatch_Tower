// flavorTemplates.js
// example usage
const flavorTemplates = {
    greetPlayer: (name) => `Hello ${name}, welcome to the forest...`,
    battleStart: (enemy) => `A wild ${enemy} appears! Prepare yourself.`,
    outcome: (won) => won ? "Victory is yours!" : "You have been defeated..."
};


const variableResolvers = {
    LANGUAGE_SUFFIX: (vars) => vars.NUMBERofENEMY > 1 ? 's' : '',
    // Add more custom resolvers here if needed
};
