import { registerHandlebarsHelpers } from "./handlebar-helpers.mjs";

const modulePath = "modules/bitd-actor-sheet";
const mName = "bitd-actor-sheet";

class BitDActorSheet extends ActorSheet {
    get template() {
        return `${modulePath}/template/bitd-actor-sheet.hbs`;
    }
    
    static get defaultOptions() {
        const options = super.defaultOptions;
        // sheet window options
        mergeObject(options, {
            classes: ["bitd", "sheet", "actor"],
            width: 750,
            height: 750
        });
        return options;
    }
    
    async getData(options) {
        // data structure from base sheet
		const context = await super.getData(options);

		// use a safe clone of actor data
		const actorData = context.data;
		context.system = actorData.system;
		context.flags = actorData.flags;
		
		// prepare character item and data
		if (actorData.type == 'character') {
			this._prepareCharacterData(context);
		} else if (actorData.type == 'crew') {
			// do stuff for crews
		}
		
		context.classes = ["grit", "thrill", "guts", "smarts", "heart", "chill"];
		
		context.modulePath = modulePath;
		
        return context;
    }
	
	_prepareCharacterData(context) {
		const gear = [];
		const traits = [];
		for (let i of context.items) {
			i.img = i.img || DEFAULT_TOKEN;
			if (i.type === 'equipment') {
				gear.push(i);
			} else if (i.type === 'feat') {
				traits.push(i);
			}
		}
		//console.log(context);
		context.gear = gear;
		context.traits = traits;
		context.bitd_stress = 0;
    context.bitd_healing = 0;
    
    context.BitD_attributes = [{
      name: 'resolve',
      label: game.i18n.localize("BitD.resolve"),
      labelXp: game.i18n.localize("BitD.resolve-xp"),
      value: this.actor.system.resolve,
      actions: [
        { name: 'hunt', value: this.actor.system.hunt, label: game.i18n.localize("BitD.hunt") },
        { name: 'study', value: this.actor.system.study, label: game.i18n.localize("BitD.study") },
        { name: 'survey', value: this.actor.system.survey, label: game.i18n.localize("BitD.survey") },
        { name: 'tinker', value: this.actor.system.tinker, label: game.i18n.localize("BitD.tinker") }
      ]
    }, {
      name: 'prowess',
      label: game.i18n.localize("BitD.prowess"),
      labelXp: game.i18n.localize("BitD.prowess-xp"),
      value: this.actor.system.prowess,
      actions: [
        { name: 'finesse', value: this.actor.system.finesse, label: game.i18n.localize("BitD.finesse") },
        { name: 'prowl', value: this.actor.system.prowl, label: game.i18n.localize("BitD.prowl") },
        { name: 'skirmish', value: this.actor.system.skirmish, label: game.i18n.localize("BitD.skirmish") },
        { name: 'wreck', value: this.actor.system.wreck, label: game.i18n.localize("BitD.wreck") }
      ]
    }, {
      name: 'insight',
      label: game.i18n.localize("BitD.insight"),
      labelXp: game.i18n.localize("BitD.insight-xp"),
      value: this.actor.system.insight,
      actions: [
        { name: 'attune', value: this.actor.system.attune, label: game.i18n.localize("BitD.attune") },
        { name: 'command', value: this.actor.system.command, label: game.i18n.localize("BitD.command") },
        { name: 'consort', value: this.actor.system.consort, label: game.i18n.localize("BitD.consort") },
        { name: 'sway', value: this.actor.system.sway, label: game.i18n.localize("BitD.sway") }
      ]
    }];
	}
	
	/** @override */
	activateListeners(html) {
		super.activateListeners(html);
		
		// Rollable abilities.
		html.on('click', '.rollable', this._onRoll.bind(this));
		// Add Inventory Item
		html.on('click', '.create', this._onCreate.bind(this));
		// Save Name change
		html.on('change', '.name', this._onNameChange.bind(this));
		// Save Img change
		html.on('change', '.item-img', this._onImgChange.bind(this));
		// Delete Item / Trait
		html.on('click', '.delete', this._onDelete.bind(this));
		// manage attributes
		html.on('click', '.attr', this._onAction.bind(this));
    // manage stress
		html.on('click', '.stress', this._onStressOrTrauma.bind(this));
    // manage trauma
		html.on('click', '.trauma', this._onStressOrTrauma.bind(this));
    // manage actions
		html.on('click', '.action', this._onAction.bind(this));
    // manage pushing yourself
		html.on('click', '.push', this._onBonusChange.bind(this));
    // manage pushing yourself
		html.on('click', '.help', this._onBonusChange.bind(this));
		
		// Count dot
		html.find('.stress-block').each(function () {
		  const value = Number(this.dataset.value);
		  $(this)
			.find(".stress")
			.each(function (i) {
			  if (i + 1 <= value) {
          $(this).addClass("full");
			  }
			});
		});
    html.find('.trauma-block').each(function () {
		  const value = Number(this.dataset.value);
		  $(this)
			.find(".trauma")
			.each(function (i) {
			  if (i + 1 <= value) {
          $(this).addClass("full");
			  }
			});
		});
    
    html.find('.attr-block').each(function () {
		  const value = Number(this.dataset.value);
		  $(this)
			.find(".attr")
			.each(function (i) {
			  if (i + 1 <= value) {
          $(this).addClass("full");
			  }
			});
		});
    
    html.find('.action-block').each(function () {
		  const value = Number(this.dataset.value);
		  $(this)
			.find(".action")
			.each(function (i) {
			  if (i + 1 <= value) {
          $(this).addClass("active");
			  }
			});
		});
    
    html.find('.push').each(function () {
		  const value = this.dataset.value;
      const bonus = this.dataset['bitd_push_bonus'];
      if (value == bonus)
        $(this).addClass("active");
		});
    
    html.find('.help').each(function() {
      const value = this.dataset.value;
      if (value !== "") $(this).addClass("active");
    });
	}

	// Handle clickable rolls.
	async _onRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;
    
    // only work when data-roll-type is defined
    if (!dataset.type) return;

		// Handle item rolls.
    if (dataset.type == 'item') {
			const itemId = element.closest('.item').dataset.itemId;
			const item = this.actor.items.get(itemId);
			if (item) return item.roll();
		}
    
    let keep = 'kh' // keep highest
    let value = 0;
    let bonus = 0;
    // get value for resistance rolls
    if (dataset.type == 'resistance') {
      switch (dataset.action) {
        case 'resolve':
          value += (this.actor.system.hunt > 0 ? 1 : 0);
          value += (this.actor.system.study > 0 ? 1 : 0);
          value += (this.actor.system.survey > 0 ? 1 : 0);
          value += (this.actor.system.tinker > 0 ? 1 : 0);
          break;
        case 'prowess':
          value += (this.actor.system.finesse > 0 ? 1 : 0);
          value += (this.actor.system.prowl > 0 ? 1 : 0);
          value += (this.actor.system.skirmish > 0 ? 1 : 0);
          value += (this.actor.system.wreck > 0 ? 1 : 0);
          break;
        case 'insight':
          value += (this.actor.system.attune > 0 ? 1 : 0);
          value += (this.actor.system.command > 0 ? 1 : 0);
          value += (this.actor.system.consort > 0 ? 1 : 0);
          value += (this.actor.system.sway > 0 ? 1 : 0);
          break;
      }
    }
    
    // Handle ACTION rolls
    if (dataset.type == 'action') {
      value = Number(dataset.value);
      // when you have nothing... and no bonus selected
      if (value == 0 && !this.actor.system.bitd_push_bonus && !this.actor.system.bitd_help_bonus) {
        value = 2;
        keep = 'kl';
      }
    }
    
    // help bonus?
    if (this.actor.system.bitd_help_bonus) {
      bonus += 1;
      await this.actor.update({'system.bitd_help_bonus': ''});
    }
    
    // push_bonus?
    if (this.actor.system.bitd_push_bonus) {
      bonus += 1;
      // add two stress
      if (this.actor.system.bitd_push_bonus == 'stress')
        await this.actor.update({'system.bitd_stress': this.actor.system.bitd_stress + 2});
      // deactivate push_bonus
      await this.actor.update({'system.bitd_push_bonus': ''});
    }
    
    // when you have none... don't roll
    if (value == 0 && bonus == 0) {
      return;
    }
    
    // let's roll!
    let formula = value > 0 ? value + 'd6' : '';
    formula += bonus > 0 ? '+' + bonus + 'd6' : '';
    formula += keep;
    let roll = new Roll(formula, this.actor.getRollData());
		roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: dataset.label,
      rollMode: game.settings.get('core', 'rollMode'),
    });
    return roll;
	}
	  
  async _onBonusChange(event) {
    event.preventDefault();
		let dataset = event.currentTarget.dataset;
    let fieldname = dataset.fieldname;
    let dom_val = dataset[fieldname];
		let new_val = this.actor.system[fieldname] != dom_val ? dom_val : "";
		
    switch (fieldname) {
      case 'bitd_push_bonus':
        await this.actor.update({'system.bitd_push_bonus': new_val});
        break;
      case 'bitd_help_bonus':
        await this.actor.update({'system.bitd_help_bonus': new_val});
        break;
    }
    console.log(this.actor);
  }
  
  async _onStressOrTrauma(event) {
		event.preventDefault();
		let dataset = event.currentTarget.dataset;
    let fieldname = dataset.fieldname;
    let dom_val = Number(dataset.index) + 1;
		let new_val = this.actor.system[fieldname] != dom_val ? dom_val : 0;
    switch (fieldname) {
      case 'bitd_stress':
        await this.actor.update({'system.bitd_stress': new_val});
        break;
      case 'bitd_trauma':
        await this.actor.update({'system.bitd_trauma': new_val});
        break;
    }
	}
  
	async _onCreate(event) {
		event.preventDefault();
		const header = event.currentTarget;
		// Get the type of item to create.
		const type = header.dataset.type;
		// Grab any data associated with this control.
		const data = duplicate(header.dataset);
		// Initialize a default name.
		const name = `New ${type.capitalize()}`;
		// Prepare the item object.
		const itemData = {
			name: name,
			type: type,
			data: data
		};
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.data["type"];

		// Finally, create the item!
		return await Item.create(itemData, {parent: this.actor});
	}
	
	async _onNameChange(event) {
		const li = $(event.currentTarget).parents('.btid-item');
		const item = this.actor.items.get(li.data('itemId'));
		return await item.update({'name':event.currentTarget.value});
	}
	
	async _onImgChange(event) {
		const li = $(event.currentTarget).parents('.btid-item');
		const item = this.actor.items.get(li.data('itemId'));
		return await item.update({'img':event.currentTarget.src});
	}
	
	async _onDelete(event) {
		const li = $(event.currentTarget).parents('.btid-item');
		const item = this.actor.items.get(li.data('itemId'));
		item.delete();
		li.slideUp(200, () => this.render(false));
	}
  
  async _onAttribute(event) {
    event.preventDefault();
		/*let new_value = Number(event.currentTarget.dataset.index) + 1;
    let key = event.currentTarget.dataset.key;
    let value = this.actor.system[key] != new_value ? new_value : 0;
		await this.actor.update({['system.'+key]: value});
		
		ChatMessage.create({
			content: key + ": " + value + ".",
			speaker: ChatMessage.getSpeaker({ actor: this.actor })
		});*/
  }
  
  async _onAction(event) {
    event.preventDefault();
		let new_value = Number(event.currentTarget.dataset.index) + 1;
    let key = event.currentTarget.dataset.key;
    let value = this.actor.system[key] != new_value ? new_value : 0;
		await this.actor.update({['system.'+key]: value});
		
		/*ChatMessage.create({
			content: key + ": " + value + ".",
			speaker: ChatMessage.getSpeaker({ actor: this.actor })
		});*/
  }
}

Hooks.once('init', async function () {
    Actors.registerSheet('bitd', BitDActorSheet, {
		makeDefault: true,
		label: 'Blades in the Dark Actor Sheet',
	});
	registerHandlebarsHelpers();
	loadTemplates([
		"modules/bitd-actor-sheet/template/parts/attributes.hbs",
		"modules/bitd-actor-sheet/template/parts/stress-and-trauma.hbs",
    "modules/bitd-actor-sheet/template/parts/harm.hbs",
    "modules/bitd-actor-sheet/template/parts/gear.hbs"
	]);
});