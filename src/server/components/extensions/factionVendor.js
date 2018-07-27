let generator = require('../../items/generator');
let skins = require('../../config/skins');
let factions = require('../../config/factions');
let itemEffects = require('../../items/itemEffects');

module.exports = {
	baseItems: [],

	cdMax: 10,

	blueprint: null,

	init: function (blueprint) {
		this.baseItems = this.items;
		this.items = {};

		this.faction = blueprint.faction;
		this.blueprint = blueprint;
	},

	getItems: function (requestedBy) {
		let name = requestedBy.name;
		let requestLevel = requestedBy.stats.values.level;

		let list = this.items[name];
		if (!list) {
			list = {
				items: [],
				level: requestLevel,
				cd: this.cdMax
			};

			this.items[name] = list;
			this.regenList(list);
		} else if (list.level != requestLevel)
			this.regenList(list);

		let reputation = requestedBy.reputation;

		let result = list.items
			.map(function (i) {
				let item = extend(true, {}, i);

				if (item.effects) {
					item.stats = {
						stats: '???'
					};
					item.quality = 0;
					item.name = item.type;

					item.effects = item.effects
						.map(function (e) {
							if (e.factionId) {
								return {
									factionId: e.factionId,
									text: e.text,
									properties: e.properties
								};
							} 
							let effectUrl = itemEffects.get(e.type);
							let effectModule = require('../../' + effectUrl);

							return {
								text: effectModule.events.onGetText(item)
							};
						});
				}

				if (item.factions) {
					item.factions = item.factions.map(function (f) {
						let faction = reputation.getBlueprint(f.id);
						let factionTier = reputation.getTier(f.id);

						let noEquip = null;
						if (factionTier < f.tier)
							noEquip = true;

						return {
							name: faction.name,
							tier: f.tier,
							tierName: ['Hated', 'Hostile', 'Unfriendly', 'Neutral', 'Friendly', 'Honored', 'Revered', 'Exalted'][f.tier],
							noEquip: noEquip
						};
					}, this);
				}

				return item;
			});

		return result;
	},

	regenList: function (list) {
		let blueprint = this.blueprint;

		list.items = null;
		list.items = [];

		let faction = factions.getFaction(blueprint.faction.id);
		let statGenerator = faction.uniqueStat;

		let itemCount = blueprint.items.min + ~~(Math.random() * (blueprint.items.max - blueprint.items.min));
		for (let i = 0; i < itemCount; i++) {
			let minLevel = blueprint.items.minLevel || Math.max(1, list.level * 0.75);
			let maxLevel = blueprint.items.maxLevel || (list.level * 1.25);
			let level = ~~(minLevel + (Math.random() * (maxLevel - minLevel)));

			let item = generator.generate({
				noSpell: true,
				magicFind: 150,
				slot: blueprint.items.slot,
				level: level
			});

			let randomQuality = ~~(Math.random() * 5);
			item.worth = Math.pow(item.level, 1.5) + (Math.pow((randomQuality + 1), 2) * 10);

			let id = 0;
			list.items.forEach(function (checkItem) {
				if (checkItem.id >= id)
					id = checkItem.id + 1;
			});

			item.id = id;

			generator.removeStat(item);
			statGenerator.generate(item);

			item.factions = [{}];
			item.factions[0].id = blueprint.faction.id;
			item.factions[0].tier = blueprint.faction.tier;

			list.items.push(item);
		}

		let baseItems = this.baseItems;
		let bLen = baseItems.length;
		for (let i = 0; i < bLen; i++) 
			list.items.push(baseItems[i]);

		let extra = blueprint.items.extra;
		if (!extra)
			return;

		let eLen = extra.length;
		for (let i = 0; i < eLen; i++) {
			let e = extra[i];

			let item = extend(true, {}, e);

			if (item.type == 'skin') {
				let skinBlueprint = skins.getBlueprint(item.id);
				item.skinId = item.id;
				item.name = skinBlueprint.name;
				item.sprite = skinBlueprint.sprite;
			} else if (item.generate) {
				let generated = generator.generate(item);
				if (item.worth)
					generated.worth = item.worth;
				if (item.infinite)
					generated.infinite = true;

				if (item.factions)
					generated.factions = item.factions;

				item = generated;
			}

			let id = 0;
			list.items.forEach(function (checkItem) {
				if (checkItem.id >= id)
					id = checkItem.id + 1;
			});

			item.id = id;

			list.items.push(item);
		}
	},

	canBuy: function (itemId, requestedBy, action) {
		let item = null;
		if (action == 'buy')
			item = this.findItem(itemId, requestedBy.name);
		else if (action == 'buyback')
			item = this.findBuyback(itemId, requestedBy.name);

		let result = true;
		if (item.factions)
			result = requestedBy.reputation.canEquipItem(item);

		if (!result) {
			requestedBy.instance.syncer.queue('onGetMessages', {
				id: requestedBy.id,
				messages: [{
					class: 'color-redA',
					message: 'your reputation is too low to buy that item',
					type: 'info'
				}]
			}, [requestedBy.serverId]);
		}

		return result;
	},

	findItem: function (itemId, sourceName) {
		let list = this.items[sourceName];
		if (!list)
			return null;

		return list.items.find(i => i.id == itemId);
	},

	removeItem: function (itemId, sourceName) {
		let list = this.items[sourceName];
		if (!sourceName)
			return null;

		return list.items.spliceFirstWhere(i => i.id == itemId);
	}
};
