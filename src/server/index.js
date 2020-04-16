require('./globals');

let server = require('./server');
let components = require('./components/components');
let mods = require('./misc/mods');
let animations = require('./config/animations');
let skins = require('./config/skins');
let factions = require('./config/factions');
let classes = require('./config/spirits');
let spellsConfig = require('./config/spellsConfig');
let spells = require('./config/spells');
let itemTypes = require('./items/config/types');
let mapList = require('./config/maps/mapList');
let sheets = require('./security/sheets');
let fixes = require('./fixes/fixes');
let profanities = require('./misc/profanities');
const routerConfig = require('./security/routerConfig');

let startup = {
	init: function () {
		io.init(this.onDbReady.bind(this));
	},

	onDbReady: async function () {
		await fixes.fixDb();

		process.on('unhandledRejection', this.onError.bind(this));
		process.on('uncaughtException', this.onError.bind(this));

		animations.init();
		mods.init(this.onModsLoaded.bind(this));
	},

	onModsLoaded: function () {
		routerConfig.init();
		classes.init();
		spellsConfig.init();
		spells.init();
		itemTypes.init();
		profanities.init();
		mapList.init();
		components.init(this.onComponentsReady.bind(this));
	},

	onComponentsReady: function () {
		skins.init();
		factions.init();
		clientConfig.init();
		server.init(this.onServerReady.bind(this));
	},

	onServerReady: async function () {
		await leaderboard.init();

		atlas.init();
		sheets.init();
	},

	onError: async function (e) {
		if (e.toString().indexOf('ERR_IPC_CHANNEL_CLOSED') > -1)
			return;

		_.log('Error Logged: ' + e.toString());
		_.log(e.stack);

		await io.setAsync({
			key: new Date(),
			table: 'error',
			value: e.toString() + ' | ' + e.stack.toString()
		});

		process.exit();
	}
};

startup.init();
