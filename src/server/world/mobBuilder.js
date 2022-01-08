let animations = require('../config/animations');
let itemGenerator = require('../items/generator');

//const track = {};

module.exports = {
	build: function (mob, blueprint, type, zoneName) {
		mob.instance.eventEmitter.emit('onBeforeBuildMob', zoneName, mob.name.toLowerCase(), blueprint);

		let typeDefinition = blueprint[type] || blueprint;

		if (blueprint.nonSelectable)
			mob.nonSelectable = true;

		mob.addComponent('effects');
		if (type && type !== 'regular') {
			mob.effects.addEffect({
				type: type
			});

			mob['is' + type[0].toUpperCase() + type.substr(1)] = true;

			mob.baseName = mob.name;
			mob.name = typeDefinition.name || mob.baseName;
		}

		if (typeDefinition.sheetName)
			mob.sheetName = typeDefinition.sheetName;

		if (typeDefinition.isDefined('cell'))
			mob.cell = typeDefinition.cell;

		mob.addComponent('stats', {
			values: {
				level: blueprint.level
			}
		});

		let cpnMob = mob.addComponent('mob');
		extend(cpnMob, {
			walkDistance: blueprint.walkDistance,
			hpMult: blueprint.hpMult || typeDefinition.hpMult,
			dmgMult: blueprint.dmgMult || typeDefinition.dmgMult,
			grantRep: blueprint.grantRep,
			deathRep: blueprint.deathRep
		});
		if (blueprint.patrol)
			cpnMob.patrol = blueprint.patrol;

		if (cpnMob.patrol)
			cpnMob.walkDistance = 1;

		cpnMob.needLos = blueprint.needLos;

		let spells = extend([], blueprint.spells);
		spells.forEach(s => {
			if (!s.animation && mob.sheetName === 'mobs' && animations.mobs[mob.cell]) 
				s.animation = 'basic';
		});

		mob.addComponent('spellbook', {
			spells: spells,
			dmgMult: typeDefinition.dmgMult
		});

		if (!blueprint.isDefined('attackable') || blueprint.attackable === true) {
			mob.addComponent('aggro', {
				faction: blueprint.faction
			});

			mob.aggro.calcThreatCeiling(type);
		}

		mob.addComponent('equipment');
		mob.addComponent('inventory', typeDefinition.drops);
		mob.inventory.inventorySize = -1;
		mob.inventory.dailyDrops = blueprint.dailyDrops;

		if (this.zone) {
			let chats = this.zone.chats;
			if (chats && chats[mob.name.toLowerCase()]) {
				mob.addComponent('chatter', {
					chats: chats[mob.name.toLowerCase()]
				});
			}

			let dialogues = this.zone.dialogues;
			if (dialogues && dialogues[mob.name.toLowerCase()]) {
				mob.addComponent('dialogue', {
					config: dialogues[mob.name.toLowerCase()]
				});
			}
		}

		if (blueprint.properties && blueprint.properties.cpnTrade)
			mob.addComponent('trade', blueprint.properties.cpnTrade);

		this.scale(mob, blueprint.level);

		mob.instance.eventEmitter.emit('onAfterBuildMob', {
			zoneName,
			mob
		});
	},

	scale: function (mob, level) {
		let drops = mob.inventory.blueprint || {};

		let statValues = mob.stats.values;

		let preferStat = ['str', 'dex', 'int'][~~(Math.random() * 3)];

		mob.equipment.unequipAll();
		mob.inventory.clear();

		let hp = level * 40;
		statValues.hpMax = hp;

		statValues.level = level;

		if ((!drops.blueprints) || (drops.alsoRandom)) {
			[
				'head',
				'chest',
				'neck',
				'hands',
				'waist',
				'legs',
				'feet',
				'finger',
				'trinket',
				'twoHanded'
			].forEach(slot => {
				let item = itemGenerator.generate({
					noSpell: true,
					level: level,
					slot: slot,
					quality: 4,
					forceStats: [preferStat]
				});

				delete item.spell;
				mob.inventory.getItem(item);
				mob.equipment.autoEquip(item.id);
			});
		} else {
			//TODO: Don't give the mob these items: he'll drop them anyway
			drops.blueprints.forEach(d => {
				if (d.type === 'key')
					return;

				let drop = extend({}, d);
				drop.level = level;

				mob.inventory.getItem(itemGenerator.generate(drop));
			});
		}

		let spellCount = (mob.isRare ? 1 : 0) + (mob.isChampion ? 2 : 0);

		for (let i = 0; i < spellCount; i++) {
			let rune = itemGenerator.generate({
				spell: true
			});
			rune.eq = true;
			mob.inventory.getItem(rune);
		}

		let dmgMult = 4.5 * mob.mob.dmgMult;
		let hpMult = 1 * mob.mob.hpMult;

		dmgMult *= [0.25, 0.4, 0.575, 0.8, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2, 2.1, 2.2, 2.3, 2.4, 2.5][level - 1];

		statValues.hpMax = ~~(statValues.hpMax * [0.1, 0.2, 0.4, 0.7, 0.78, 0.91, 1.16, 1.19, 1.65, 2.36, 3.07, 3.55, 4.1, 4.85, 5.6, 5.9, 6.5, 7.1, 7.9, 12][level - 1]);

		statValues.hpMax *= hpMult;
		statValues.hp = statValues.hpMax;
		statValues.mana = statValues.manaMax;

		mob.spellbook.spells.forEach(s => {
			s.dmgMult = s.name ? dmgMult / 3 : dmgMult;
			s.statType = preferStat;
			s.manaCost = 0;
		});

		//Hack to disallow low level mobs from having any lifeOnHit
		// since that makes it very difficult (and confusing) for low level players
		if (level <= 3)
			mob.stats.values.lifeOnHit = 0;

		['hp', 'hpMax', 'mana', 'manaMax', 'level'].forEach(s => mob.syncer.setObject(false, 'stats', 'values', s, statValues[s]));
	}
};
