const events = require('../misc/events');

let g1 = require('./generators/level'); 
let g2 = require('./generators/quality'); 
let g3 = require('./generators/slots'); 
let g4 = require('./generators/types'); 
let g5 = require('./generators/stats'); 
let g6 = require('./generators/names'); 
let g7 = require('./generators/worth'); 
let g8 = require('./generators/quantity'); 
let g9 = require('./generators/spellbook'); 
let g10 = require('./generators/currency'); 
let g11 = require('./generators/effects'); 
let g12 = require('./generators/attrRequire');
let g13 = require('./generators/recipeBook');

let generators = [g1, g2, g3, g4, g5, g6, g11, g12, g7];
let materialGenerators = [g6, g8];
let spellGenerators = [g1, g2, g9, g7];
let currencyGenerators = [g10, g8];
let recipeGenerators = [g6, g13];

module.exports = {
	spellChance: 0.035,
	currencyChance: 0.035,

	generate: function (blueprint, ownerLevel) {
		let isSpell = false;
		let isCurrency = false;

		let hadBlueprint = !!blueprint;
		blueprint = blueprint || {};

		let item = {};

		const generateEvent = {
			blueprint,
			item,
			ignore: false
		};

		events.emit('onBeforeGenerateItem', generateEvent);
		if (generateEvent.ignore)
			return item;

		const dropChancesEvent = {
			blueprint,
			spellChance: this.spellChance,
			currencyChance: this.currencyChance
		};

		if (!blueprint.slot && !blueprint.type && !blueprint.spell)
			global.instancer.instances[0].eventEmitter.emitNoSticky('onBeforeGetDropChances', dropChancesEvent);

		let currencyChance = dropChancesEvent.currencyChance;
		//If you kill a mob that's too low of a level, idols are much more rare
		if (
			blueprint.level && 
			ownerLevel && 
			ownerLevel - blueprint.level > 4
		) {
			const levelDelta = ownerLevel - blueprint.level;
			currencyChance /= Math.pow(levelDelta - 3, 2);
		}
		if (blueprint.noCurrency)
			currencyChance = 0;

		if (!blueprint.slot && !blueprint.noSpell && !blueprint.material) {
			isSpell = blueprint.spell;
			isCurrency = blueprint.currency;
			if ((!isCurrency) && (!isSpell) && ((!hadBlueprint) || ((!blueprint.type) && (!blueprint.slot) && (!blueprint.stats)))) {
				isSpell = Math.random() < dropChancesEvent.spellChance;
				if (!isSpell)
					isCurrency = Math.random() < currencyChance;
			}
		}

		if (blueprint.isSpell)
			isSpell = true;

		if (isSpell)
			spellGenerators.forEach(g => g.generate(item, blueprint));
		else if (isCurrency) 
			currencyGenerators.forEach(g => g.generate(item, blueprint));
		else if (blueprint.material) {
			item.material = true;
			item.sprite = blueprint.sprite || null;
			item.noDrop = blueprint.noDrop || null;
			item.noSalvage = blueprint.noSalvage || null;
			item.noDestroy = blueprint.noDestroy || null;
			item.quality = blueprint.quality || 0;
			materialGenerators.forEach(g => g.generate(item, blueprint));
		} else if (blueprint.type === 'mtx') {
			item = extend({}, blueprint);
			delete item.chance;
		} else if (blueprint.type === 'recipe') 
			recipeGenerators.forEach(g => g.generate(item, blueprint));
		else {
			generators.forEach(g => g.generate(item, blueprint));
			if (blueprint.spellName)
				g9.generate(item, blueprint);
		}

		if (blueprint.spritesheet)
			item.spritesheet = blueprint.spritesheet;

		if (blueprint.noSalvage)
			item.noSalvage = true;

		if (blueprint.uses)
			item.uses = blueprint.uses;

		events.emit('onAfterGenerateItem', generateEvent);

		return item;
	},

	removeStat: function (item, stat) {
		if (!stat) {
			stat = Object.keys(item.stats)
				.filter(s => (s !== 'armor'));

			stat = stat[~~(Math.random() * stat.length)];
		}

		delete item.stats[stat];

		if (stat === 'lvlRequire') {
			item.level = item.originalLevel;
			delete item.originalLevel;
		}
	},

	pickRandomSlot: function () {
		let item = {};
		let blueprint = {};
		g3.generate(item, blueprint);

		return item.slot;
	}
};
