let roles = require('../../config/roles');
let generator = require('../../items/generator');
let configSlots = require('../../items/config/slots');
let factions = require('../../config/factions');
let connections = require('../../security/connections');
const events = require('../../misc/events');

const ban = require('../social/ban');
const rezone = require('../social/rezone');
const canChat = require('../social/canChat');
const startEvent = require('../social/startEvent');
const stopEvent = require('../social/stopEvent');
const teleport = require('../social/teleport');

let commandRoles = {
	//Regular players
	join: 0,
	leave: 0,
	unEq: 0,
	roll: 0,
	block: 0,
	unblock: 0,
	help: 0,

	//Mods
	ban: 5,
	mute: 5,
	unmute: 5,

	//Super Mods
	broadcast: 8,
	saveAll: 8,

	//Admin
	getItem: 10,
	getGold: 10,
	setLevel: 10,
	godMode: 10,
	clearInventory: 10,
	completeQuests: 10,
	getReputation: 10,
	loseReputation: 10,
	setStat: 10,
	die: 10,
	getXp: 10,
	setPassword: 10,
	giveSkin: 10,
	rezone: 10,
	startEvent: 10,
	stopEvent: 10,
	teleport: 10
};

//Commands that should be run on the main thread (not the zone thread)
const localCommands = [
	'ban',
	'join',
	'leave',
	'mute',
	'unmute',
	'setPassword',
	'roll',
	'giveSkin',
	'broadcast',
	'saveAll',
	'ban',
	'help',
	'startEvent',
	'stopEvent'
];

//Actions that should appear when a player is right clicked
const contextActions = [
	{
		command: 'mute',
		text: 'mute'
	},
	{
		command: 'unmute',
		text: 'unmute'
	},
	{
		command: 'ban',
		text: 'ban'
	}
];

const commandActions = {};

module.exports = {
	customChannels: [],
	roleLevel: null,

	init: function (blueprint) {
		if (this.customChannels) {
			this.customChannels = this.customChannels
				.filter((c, i) => (this.customChannels.indexOf(c) === i));
		}

		events.emit('onBeforeGetCommandRoles', commandRoles, commandActions);
		Object.entries(commandActions).forEach(a => {
			const [ actionName, actionHandler ] = a;

			this[actionName] = actionHandler.bind(this);
		});

		this.roleLevel = roles.getRoleLevel(this.obj);
		this.calculateActions();
	},

	calculateActions: function () {
		this.actions = contextActions
			.filter(c => this.roleLevel >= commandRoles[c.command]);
	},

	onBeforeChat: function (msg) {
		let messageText = msg.message;
		if (messageText[0] !== '/')
			return;
		msg.ignore = true;

		messageText = messageText.substr(1).split(' ');
		let actionName = messageText.splice(0, 1)[0].toLowerCase();
		actionName = Object.keys(commandRoles).find(a => (a.toLowerCase() === actionName));

		if (!actionName) {
			this.obj.socket.emit('events', {
				onGetMessages: [{
					messages: [{
						class: 'color-redA',
						message: 'Invalid command.',
						type: 'info'
					}]
				}]
			});
			return;
		} else if (this.roleLevel < commandRoles[actionName]) {
			this.obj.socket.emit('events', {
				onGetMessages: [{
					messages: [{
						class: 'color-redA',
						message: 'You do not have the required permissions.',
						type: 'info'
					}]
				}]
			});
			return;
		}

		let config = {};
		const originalConfig = messageText.join(' ');
		if ((messageText.length === 1) && (messageText[0].indexOf('=') === -1))
			config = messageText[0];
		else {
			messageText.forEach(function (m) {
				m = m.split('=');
				config[m[0]] = m[1];
			});
		}

		if (localCommands.includes(actionName)) 
			this[actionName](config, originalConfig);
		else {
			atlas.performAction(this.obj, {
				cpn: 'social',
				method: actionName,
				data: config
			});
		}
	},

	//actions
	join: async function (value) {
		if (typeof (value) !== 'string')
			return;

		value = value
			.trim()
			.split(' ').join('');

		let obj = this.obj;

		if (value.length === 0)
			return;
		else if (!value.match(/^[0-9a-zA-Z]+$/)) {
			obj.socket.emit('events', {
				onGetMessages: [{
					messages: [{
						class: 'color-redA',
						message: 'Channel names may only contain letters and numbers.',
						type: 'info'
					}]
				}]
			});
			return;
		} else if (value.length > 15) {
			obj.socket.emit('events', {
				onGetMessages: [{
					messages: [{
						class: 'color-redA',
						message: 'Channel names can not be longer than 15 characters.',
						type: 'info'
					}]
				}]
			});
			return;
		}

		let channels = obj.auth.customChannels;
		if (!channels.some(c => (c === value)))
			channels.push(value);
		else
			return;

		channels.push(value);

		let charname = obj.auth.charname;
		await io.setAsync({
			key: charname,
			table: 'customChannels',
			value: channels,
			serialize: true
		});

		obj.socket.emit('events', {
			onGetMessages: [{
				messages: [{
					class: 'color-yellowB',
					message: 'joined channel: ' + value,
					type: 'info'
				}]
			}]
		});

		obj.socket.emit('event', {
			event: 'onJoinChannel',
			data: value
		});
	},

	leave: async function (value) {
		if (typeof (value) !== 'string')
			return;

		let obj = this.obj;

		let channels = obj.auth.customChannels;
		if (!channels.some(c => (c === value))) {
			obj.socket.emit('events', {
				onGetMessages: [{
					messages: [{
						class: 'color-redA',
						message: 'you are not currently in that channel',
						type: 'info'
					}]
				}]
			});

			return;
		}

		channels.spliceWhere(c => (c === value));

		let charname = obj.auth.charname;
		await io.setAsync({
			key: charname,
			table: 'customChannels',
			value: channels,
			serialize: true
		});

		obj.socket.emit('event', {
			event: 'onLeaveChannel',
			data: value
		});

		this.obj.socket.emit('events', {
			onGetMessages: [{
				messages: [{
					class: 'color-yellowB',
					message: 'left channel: ' + value,
					type: 'info'
				}]
			}]
		});
	},

	block: function (target) {
		const { obj, blockedPlayers } = this;
		const { name, social, syncer } = obj;

		if (blockedPlayers.includes(target)) {
			social.notifySelf({ message: 'That player has already been blocked' });

			return;
		} else if (target === name) {
			social.notifySelf({ message: 'You cannot block yourself' });

			return;
		}

		blockedPlayers.push(target);
		syncer.set(true, 'social', 'blockedPlayers', blockedPlayers);

		social.notifySelf({
			message: `Successfully blocked ${target}`,
			className: 'color-yellowB'
		});
	},

	unblock: function (target) {
		const { obj, blockedPlayers } = this;
		const { social, syncer } = obj;

		if (!blockedPlayers.includes(target)) {
			social.notifySelf({ message: 'That player is not blocked' });

			return;
		}

		blockedPlayers.spliceWhere(f => f === target);
		syncer.set(true, 'social', 'blockedPlayers', blockedPlayers);

		social.notifySelf({ 
			message: `Successfully unblocked ${target}`,
			className: 'color-yellowB'
		});
	},

	help: function () {
		const msg = [
			'You can use the following commands:', 
			...Object.keys(commandRoles)
				.filter(c => this.roleLevel >= commandRoles[c])
				.map(c => `/${c}`)
		].join('<br />');
	
		this.sendMessage(msg, 'color-yellowB');
	},

	isInChannel: function (character, channel) {
		return character.auth.customChannels.some(c => (c === channel));
	},

	roll: function () {
		if (!canChat(this.obj)) {
			this.sendMessage('Your character needs to be played for at least 3 minutes or be at least level 3 to be able to send messages in chat.', 'color-redA');
			return;
		}

		const roll = 1 + ~~(Math.random() * 100);
		cons.emit('event', {
			event: 'onGetMessages',
			data: {
				messages: [{
					class: 'color-grayB',
					message: `${this.obj.name} rolled ${roll}`,
					type: 'chat',
					source: this.obj.name
				}]
			}
		});
	},

	unEq: function () {
		let eq = this.obj.equipment;
		Object.keys(eq.eq).forEach(function (slot) {
			eq.unequip(eq.eq[slot]);
		});
	},

	mute: async function (target, reason = null) {
		if (typeof (target) === 'object') {
			let keys = Object.keys(target);
			target = keys[0];
			reason = keys[1] || null;
		}

		if (target === this.obj.name)
			return;

		let o = connections.players.find(f => (f.name === target));
		if (!o)
			return;

		let role = roles.getRoleLevel(o);
		if (role >= this.roleLevel)
			return;

		let social = o.social;
		if (social.muted) {
			this.sendMessage('That player has already been muted', 'color-redA');
			return;
		}

		let reasonMsg = '';
		if (reason)
			reasonMsg = ' (' + reason + ')';

		social.muted = true;
		this.sendMessage('Successfully muted ' + target, 'color-yellowB');
		this.sendMessage('You have been muted' + reasonMsg, 'color-yellowB', o);

		atlas.updateObject(o, {
			components: [{
				type: 'social',
				muted: true
			}]
		});

		await io.setAsync({
			key: new Date(),
			table: 'modLog',
			value: {
				source: this.obj.name,
				command: 'mute',
				target: target,
				reason: reason
			},
			serialize: true
		});
	},

	unmute: async function (target, reason = null) {
		if (typeof (target) === 'object') {
			let keys = Object.keys(target);
			target = keys[0];
			reason = keys[1] || null;
		}

		if (target === this.obj.name)
			return;

		let o = connections.players.find(f => (f.name === target));
		if (!o)
			return;

		let role = roles.getRoleLevel(o);
		if (role >= this.roleLevel)
			return;

		let social = o.social;
		if (!social.muted) {
			this.sendMessage('That player is not muted', 'color-redA');
			return;
		}

		let reasonMsg = '';
		if (reason)
			reasonMsg = ' (' + reason + ')';

		delete social.muted;
		this.sendMessage('Successfully unmuted ' + target, 'color-yellowB');
		this.sendMessage('You have been unmuted' + reasonMsg, 'color-yellowB', o);

		atlas.updateObject(o, {
			components: [{
				type: 'social',
				muted: null
			}]
		});

		await io.setAsync({
			key: new Date(),
			table: 'modLog',
			value: {
				source: this.obj.name,
				command: 'unmute',
				target: target,
				reason: reason
			},
			serialize: true
		});
	},

	clearInventory: function () {
		let inventory = this.obj.inventory;

		inventory.items
			.filter(i => !i.eq)
			.map(i => i.id)
			.forEach(i => inventory.destroyItem(i, null, true));
	},

	getItem: function (config) {
		if (typeof config !== 'object')
			return;

		if (config.slot === 'set') {
			configSlots.slots.forEach(function (s) {
				if (s === 'tool')
					return;

				let newConfig = extend({}, config, {
					slot: s
				});

				this.getItem(newConfig);
			}, this);

			return;
		}

		if (config.stats)
			config.stats = config.stats.split(',');

		if (config.name)
			config.name = config.name.split('_').join(' ');

		if (config.spellName)
			config.spellName = config.spellName.split('_').join(' ');

		if (config.type)
			config.type = config.type.split('_').join(' ');

		if (config.sprite)
			config.sprite = config.sprite.split('_');

		let spritesheet = config.spritesheet;
		delete config.spritesheet;

		let factionList = (config.factions || '').split(',');
		delete config.factions;

		let safe = config.safe;
		delete config.safe;

		let eq = config.eq;
		delete config.eq;

		let item = generator.generate(config);

		if (safe) {
			item.noDrop = true;
			item.noDestroy = true;
			item.noSalvage = true;
		}

		factionList.forEach(function (f) {
			if (f === '')
				return;

			let faction = factions.getFaction(f);
			faction.uniqueStat.generate(item);

			item.factions = [];
			item.factions.push({
				id: f,
				tier: 3
			});
		});

		if (spritesheet)
			item.spritesheet = spritesheet;

		let newItem = this.obj.inventory.getItem(item);

		if (eq)
			this.obj.equipment.equip(newItem.id);
	},

	getGold: function (amount) {
		let newGold = this.obj.trade.gold + ~~amount;
		newGold = Math.max(-1000000000, Math.min(1000000000, newGold));

		this.obj.trade.gold = newGold;
		this.obj.syncer.set(true, 'trade', 'gold', newGold);
	},

	setLevel: function (level) {
		let obj = this.obj;
		let syncer = obj.syncer;

		level = Math.max(1, ~~level);

		let stats = obj.stats;
		let values = stats.values;
		let oldLevel = values.level;

		values.level = level;

		let delta = level - oldLevel;

		values.hpMax += (40 * delta);

		syncer.setObject(true, 'stats', 'values', 'level', level);
		syncer.setObject(true, 'stats', 'values', 'hpMax', values.hpMax);

		process.send({
			method: 'object',
			serverId: obj.serverId,
			obj: {
				level: level
			}
		});

		stats.calcXpMax();
	},

	godMode: function () {
		let obj = this.obj;

		let statValues = obj.stats.values;
		let newValues = {
			int: 10000000,
			str: 10000000,
			dex: 10000000,
			hpMax: 10000000,
			hp: 10000000,
			manaMax: 10000000,
			mana: 10000000,
			sprintChance: 100,
			vit: 10000000
		};

		let syncer = obj.syncer;

		for (let s in newValues) {
			let newValue = newValues[s];
			statValues[s] = newValue;

			syncer.setObject(true, 'stats', 'values', s, newValue);
		}

		obj.spellbook.calcDps();
	},

	completeQuests: function () {
		let obj = this.obj;
		let quests = obj.quests;

		quests.quests.forEach(function (q) {
			q.isReady = true;
			q.complete();
		}, this);

		quests.quests = [];
		obj.instance.questBuilder.obtain(obj);
	},

	getReputation: function (faction) {
		if (typeof (faction) !== 'string')
			return;

		this.obj.reputation.getReputation(faction, 50000);
	},

	loseReputation: function (faction) {
		if (typeof (faction) !== 'string')
			return;

		this.obj.reputation.getReputation(faction, -50000);
	},

	setStat: function (config) {
		this.obj.stats.values[config.stat] = ~~config.value;
	},

	getXp: function (amount) {
		this.obj.stats.getXp(amount, this.obj, this.obj);
	},

	die: function () {
		this.obj.stats.takeDamage({
			amount: 99999
		}, 1, this.obj);
	},

	setPassword: async function (config) {
		let keys = Object.keys(config);
		let username = keys[0]
			.split('_')
			.join(' ');
			
		let hashedPassword = keys[1];

		await io.setAsync({
			key: username,
			table: 'login',
			value: hashedPassword
		});
	},

	giveSkin: async function (config) {
		let keys = Object.keys(config);
		let username = keys[0];
		let skinId = keys[1];

		let skins = await io.getAsync({
			key: username,
			table: 'skins',
			isArray: true
		});

		skins.push(skinId);

		await io.setAsync({
			key: username,
			table: 'skins',
			value: skins,
			serialize: true
		});
	},

	broadcast: function (config, msg) {
		if (typeof(msg) === 'object')
			msg = Object.keys(msg).join(' ');

		cons.emit('event', {
			event: 'onGetMessages',
			data: {
				messages: [{
					class: 'color-blueA',
					message: msg,
					type: 'chat'
				}]
			}
		});
	},

	saveAll: function () {
		connections.forceSaveAll();
	},

	ban: function (msg) {
		ban(this, msg);
	},

	rezone: function (msg) {
		rezone(this, msg);
	},

	startEvent: function (msg) {
		startEvent(this, msg);
	},

	stopEvent: function (msg) {
		stopEvent(this, msg);
	},

	teleport: function (msg) {
		teleport(this, msg);
	}
};
