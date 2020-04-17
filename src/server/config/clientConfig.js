const events = require('../misc/events');
const tos = require('./tos');

const config = {
	logoPath: null,
	resourceList: [],
	textureList: [
		'tiles',
		'walls',
		'mobs',
		'bosses',
		'animBigObjects',
		'bigObjects',
		'objects',
		'characters',
		'attacks',
		'ui',
		'auras',
		'animChar',
		'animMob',
		'animBoss',
		'white',
		'ray',
		'images/skins/0001.png',
		'images/skins/0010.png',
		'images/skins/0012.png'
	],
	//Client components required by mods
	// Format: [ 'cpnPath', ... ]
	components: [],
	uiList: [],
	contextMenuActions: {
		player: [],
		npc: []
	},
	tos
};

module.exports = {
	init: function () {
		events.emit('onBeforeGetClientConfig', config);

		//Deprecated
		events.emit('onBeforeGetResourceList', config.resourceList);
		events.emit('onBeforeGetUiList', config.uiList);
		events.emit('onBeforeGetContextMenuActions', config.contextMenuActions);
		events.emit('onBeforeGetTermsOfService', config.tos);
		events.emit('onBeforeGetTextureList', config.textureList);
	},

	getClientConfig: function (msg) {
		msg.callback(config);
	}
};
