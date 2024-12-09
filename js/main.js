const modulePath = "modules/slugblaster-actor-sheet";
const mName = "slugblaster-actor-sheet";

class SlugblasterActorSheet {
    get template() {
        return `${modulePath}/template/slugblaster-actor-sheet.html`;
    }
    
    static get defaultOptions() {
        const options = super.defaultOptions;
        // sheet window options
        mergeObject(options, {
            classes: ["slugblaster", "sheet", "actor"],
            width: 650,
            height: 350
        });
        return options;
    }
    
    async getData(options) {
        const context = await super.getData(options);
        context.isGM = game.user.isGM;
        // set some default values
        if (!context.actor.flags[mName]) {
            context.actor.flags[mName] = {'atk':0,'def':10,'pow':0,'tou':10,'mor':0,'com':0,'attacks':1,'damage':1,'size':6};
        }
        return context;
    }
}

Hooks.once('init', async function () {
    Actors.registerSheet('dnd5e', SlugblasterActorSheet, {
        types: ['character'],
        makeDefault: false
    });
	Actors.registerSheet('pf2e', SlugblasterActorSheet, {
        types: ['character'],
        makeDefault: false
    });
	console.log("SlugblasterActorSheet | Initialized");
});
