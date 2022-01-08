const physics = require('./physics');
const resourceSpawner = require('./resourceSpawner');
const globalZone = require('../config/zoneBase');
const randomMap = require('./randomMap/randomMap');
const generateMappings = require('./randomMap/generateMappings');
const events = require('../misc/events');
const spriteBuilder = require('./spriteBuilder/index');

//Builders
const buildTile = require('./map/builders/tile');
const buildObject = require('./map/builders/object');

//Helpers
const canPathFromPos = require('./map/canPathFromPos');
const getObjectifiedProperties = require('./map/getObjectifiedProperties');

let mapFile = null;
let mapScale = null;
let padding = null;

module.exports = {
	name: null,
	path: null,
	layers: [],

	mapFile: null,

	//The size of the base map, before mods are applied
	originalSize: {
		w: 0,
		h: 0
	},
	//The size of the map after mods are applied
	size: {
		w: 0,
		h: 0
	},

	custom: null,

	collisionMap: null,

	clientMap: null,
	oldLayers: {
		tiles: null,
		walls: null,
		doodads: null
	},

	objBlueprints: [],

	spawn: {
		x: 0,
		y: 0
	},

	rooms: [],
	hiddenRooms: [],

	hiddenWalls: null,
	hiddenTiles: null,

	zone: null,

	init: function (args) {
		this.name = args.name;
		this.path = args.path;
		
		try {
			this.zone = require('../' + this.path + '/' + this.name + '/zone');
		} catch (e) {
			this.zone = globalZone;
		}
		events.emit('onAfterGetZone', this.name, this.zone);

		let chats = null;
		try {
			chats = require('../' + this.path + '/' + this.name + '/chats');
		} catch (e) {}
		if (chats)
			this.zone.chats = chats;

		let dialogues = null;
		try {
			dialogues = require('../' + this.path + '/' + this.name + '/dialogues');
		} catch (e) {}
		events.emit('onBeforeGetDialogue', this.name, dialogues);
		if (dialogues)
			this.zone.dialogues = dialogues;

		this.zone = extend({}, globalZone, this.zone);

		let resources = this.zone.resources || {};
		for (let r in resources)
			resourceSpawner.register(r, resources[r]);

		mapFile = require('../' + this.path + '/' + this.name + '/map');
		this.mapFile = mapFile;
		//Fix for newer versions of Tiled
		this.mapFile.properties = getObjectifiedProperties(this.mapFile.properties);

		mapScale = mapFile.tilesets[0].tileheight;
		this.mapScale = mapScale;

		this.custom = mapFile.properties.custom;

		if (mapFile.properties.spawn) {
			this.spawn = JSON.parse(mapFile.properties.spawn);
			if (!this.spawn.push)
				this.spawn = [this.spawn];
		}
	},
	create: function () {
		this.getMapFile();

		this.clientMap = {
			zoneId: -1,
			map: this.layers,
			collisionMap: this.collisionMap,
			clientObjects: this.objBlueprints,
			padding: padding,
			hiddenRooms: this.hiddenRooms,
			spriteAtlasPath: spriteBuilder.getPath(),
			noFlipTiles: spriteBuilder.getNoFlipTiles(),
			tileOpacities: spriteBuilder.getTileOpacities()
		};
	},

	getMapFile: function () {
		this.build();

		this.randomMap = extend({}, randomMap);
		this.oldMap = extend([], this.layers);

		this.randomMap.templates = extend([], this.rooms);
		generateMappings(this.randomMap, this);

		if (!mapFile.properties.isRandom) {
			for (let i = 0; i < this.size.w; i++) {
				let row = this.layers[i];
				for (let j = 0; j < this.size.h; j++) {
					let cell = row[j];
					if (!cell)
						continue;

					cell = cell.split(',');
					let cLen = cell.length;

					let newCell = '';
					for (let k = 0; k < cLen; k++) {
						let c = cell[k];
						let newC = c;

						//Randomize tile
						const msgBeforeRandomizePosition = {
							success: true,
							x: i,
							y: j,
							map: this.name
						};
						events.emit('onBeforeRandomizePosition', msgBeforeRandomizePosition);
						if (msgBeforeRandomizePosition.success)
							newC = this.randomMap.randomizeTile(c);

						newCell += newC;

						//Wall?
						if ((c >= 160) && (c <= 352) && (newC === 0))
							this.collisionMap[i][j] = 0;

						if (k < cLen - 1)
							newCell += ',';
					}

					let fakeContents = [];
					const hiddenWall = this.hiddenWalls[i][j];
					const hiddenTile = this.hiddenTiles[i][j];

					if (hiddenTile)
						fakeContents.push(-this.randomMap.randomizeTile(hiddenTile));
					if (hiddenWall)
						fakeContents.push(-this.randomMap.randomizeTile(hiddenWall));

					if (fakeContents.length)
						newCell += ',' + fakeContents.join(',');

					row[j] = newCell;
				}
			}
		}

		//Fix for newer versions of Tiled
		this.randomMap.templates
			.forEach(r => {
				r.properties = getObjectifiedProperties(r.properties);
			});

		this.randomMap.templates
			.filter(r => r.properties.mapping)
			.forEach(function (m) {
				let x = m.x;
				let y = m.y;
				let w = m.width;
				let h = m.height;

				for (let i = x; i < x + w; i++) {
					let row = this.layers[i];

					for (let j = y; j < y + h; j++)
						row[j] = '';
				}
			}, this);

		physics.init(this.collisionMap);

		padding = mapFile.properties.padding;

		mapFile = null;
	},

	build: function () {
		const mapSize = {
			w: mapFile.width,
			h: mapFile.height
		};

		this.originalSize = {
			w: mapFile.width,
			h: mapFile.height
		};

		events.emit('onBeforeGetMapSize', this.name, mapSize);

		this.size.w = mapSize.w;
		this.size.h = mapSize.h;

		const { w: oldW, h: oldH } = this.originalSize;
		const { w, h } = this.size;

		this.layers = _.get2dArray(w, h, null);
		this.hiddenWalls = _.get2dArray(w, h, null);
		this.hiddenTiles = _.get2dArray(w, h, null);

		this.oldLayers.tiles = _.get2dArray(w, h, 0);
		this.oldLayers.walls = _.get2dArray(w, h, 0);
		this.oldLayers.doodads = _.get2dArray(w, h, 0);

		let builders = {
			tile: this.builders.tile.bind(this),
			object: this.builders.object.bind(this)
		};

		this.collisionMap = _.get2dArray(w, h);

		const layers = [...mapFile.layers.filter(l => l.objects), ...mapFile.layers.filter(l => !l.objects)];

		//Rooms need to be ahead of exits
		const layerRooms = layers.find(l => l.name === 'rooms') || {};
		layerRooms.objects.sort((a, b) => {
			const isExitA = a?.properties?.some(p => p.name === 'exit');
			const isExitB = b?.properties?.some(p => p.name === 'exit');

			if (isExitA && !isExitB)
				return 1;
			else if (!isExitA && isExitB)
				return -1;

			return 0;
		});

		for (let i = 0; i < layers.length; i++) {
			let layer = layers[i];
			let layerName = layer.name;
			if (!layer.visible)
				continue;

			let data = layer.data || layer.objects;
			if (layer.objects) {
				let info = {
					map: this.name,
					layer: layerName,
					objects: data,
					mapScale,
					size: this.size
				};

				events.emit('onAfterGetLayerObjects', info);
			}

			if (layer.objects) {
				let len = data.length;
				for (let j = 0; j < len; j++) {
					let cell = data[j];

					builders.object(layerName, cell, j);
				}
			} else {
				for (let x = 0; x < w; x++) {
					for (let y = 0; y < h; y++) {
						let index = (y * oldW) + x;

						const msgBuild = {
							map: this.name,
							layer: layerName,
							sheetName: null,
							cell: 0,
							x,
							y
						};
						if (x < oldW && y < oldH)
							msgBuild.cell = data[index];

						events.emit('onBeforeBuildLayerTile', msgBuild);
						builders.tile(msgBuild);
						events.emit('onAfterBuildLayerTile', msgBuild);
					}
				}
			}
		}
	},

	getOffsetCellPos: function (sheetName, cell) {
		const { config: { atlasTextureDimensions, atlasTextures } } = clientConfig;
		const indexInAtlas = atlasTextures.indexOf(sheetName);

		let offset = 0;
		for (let i = 0; i < indexInAtlas; i++) {
			const dimensions = atlasTextureDimensions[atlasTextures[i]];

			offset += (dimensions.width / 8) * (dimensions.height / 8);
		}

		return cell + offset;
	},

	getCellInfo: function (gid, x, y, layerName) {
		const cellInfoMsg = {
			mapName: this.name,
			x,
			y,
			layerName,
			tilesets: mapFile.tilesets,
			sheetName: null
		};
		events.emit('onBeforeGetCellInfo', cellInfoMsg);

		const tilesets = cellInfoMsg.tilesets;

		let flipX = null;

		if ((gid ^ 0x80000000) > 0) {
			flipX = true;
			gid = gid ^ 0x80000000;
		}

		let firstGid = 0;
		let sheetName = cellInfoMsg.sheetName;

		if (!sheetName) {
			for (let s = 0; s < tilesets.length; s++) {
				let tileset = tilesets[s];
				if (tileset.firstgid <= gid) {
					sheetName = tileset.name;
					firstGid = tileset.firstgid;
				}
			}

			gid = gid - firstGid + 1;
		}

		return {
			cell: gid,
			sheetName,
			flipX
		};
	},

	builders: {
		tile: function (info) {
			buildTile(this, info);
		},

		object: function (layerName, cell) {
			buildObject(this, layerName, cell);
		}
	},

	getSpawnPos: function (obj) {
		let stats = obj.components.find(c => (c.type === 'stats'));
		let level = stats.values.level;

		let spawns = this.spawn.filter(s => (((s.maxLevel) && (s.maxLevel >= level)) || (!s.maxLevel)));
		return spawns[0];
	},

	//Find if any spawns can path to a position. This is important for when maps change and players 
	// log in on tiles that aren't blocking but not able to reach anywhere useful
	canPathFromPos: function (pos) {
		return canPathFromPos(this, pos);
	}
};
