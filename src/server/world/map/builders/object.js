//Imports
const objects = require('../../../objects/objects');
const spawners = require('./../../spawners');
const resourceSpawner = require('../../resourceSpawner');

const mapObjects = require('../mapObjects');
const getObjectifiedProperties = require('../getObjectifiedProperties');

//Helpers
const buildRoom = (mapModule, blueprint) => {
	if (blueprint.properties.exit) {
		const room = mapModule.rooms.find(r => {
			return (!(
				(blueprint.x + blueprint.width < r.x) ||
								(blueprint.y + blueprint.height < r.y) ||
								(blueprint.x >= r.x + r.width) ||
								(blueprint.y >= r.y + r.height)
			));
		});

		room.exits.push(blueprint);
	} else if (blueprint.properties.resource) 
		resourceSpawner.register(blueprint.properties.resource, blueprint);
	else {
		blueprint.exits = [];
		blueprint.objects = [];
		mapModule.rooms.push(blueprint);
	}
};

const buildHiddenRoom = (mapModule, blueprint) => {
	const { mapFile } = mapModule;
	const { properties } = blueprint;

	blueprint.fog = (properties || {}).fog;
	blueprint.interior = (properties || {}).interior;
	blueprint.discoverable = (properties || {}).discoverable;
	blueprint.layer = ~~((properties || {}).layer || 0);

	if (!mapFile.properties.isRandom)
		mapModule.hiddenRooms.push(blueprint);
	else {
		const room = mapModule.rooms.find(r => {
			return !(
				blueprint.x < r.x ||
							blueprint.y < r.y ||
							blueprint.x >= r.x + r.width ||
							blueprint.y >= r.y + r.height
			);
		});

		room.objects.push(blueprint);
	}
};

const buildRegularObject = (mapModule, blueprint) => {
	const { mapFile } = mapModule;

	if (!mapFile.properties.isRandom)
		spawners.register(blueprint, blueprint.spawnCd || mapFile.properties.spawnCd);
	else {
		const room = mapModule.rooms.find(r => {
			return !(
				blueprint.x < r.x ||
							blueprint.y < r.y ||
							blueprint.x >= r.x + r.width ||
							blueprint.y >= r.y + r.height
			);
		});

		room.objects.push(blueprint);
	}
};

const buildClientObject = (mapModule, blueprint) => {
	const { mapScale } = mapModule;

	const { width, height, polyline } = blueprint;

	if (width && !polyline) {
		blueprint.width = width / mapScale;
		blueprint.height = height / mapScale;
	}

	const obj = objects.buildObjects([blueprint], true).getSimple(true);
	mapModule.objBlueprints.push(obj);
};

//Builder
const buildObject = (mapModule, layerName, mapObj) => {
	const { mapScale } = mapModule;

	const { gid, x, y, width, height, sheetName, cell, polyline, polygon, properties } = mapObj;

	const clientObj = (layerName === 'clientObjects');
	const cellInfo = mapModule.getCellInfo(gid, x, y, layerName);

	let name = (mapObj.name || '');
	let objZoneName = name;
	if (name.indexOf('|') > -1) {
		const split = name.split('|');
		name = split[0];
		objZoneName = split[1];
	}

	const blueprint = {
		clientObj: clientObj,
		sheetName: sheetName !== undefined ? sheetName : cellInfo.sheetName,
		cell: cell !== undefined ? cell : cellInfo.cell - 1,
		x: x / mapScale,
		y: (y / mapScale) - 1,
		name: name,
		layerName: layerName,
		properties: getObjectifiedProperties(properties),
		polyline: polyline ?? polygon
	};

	blueprint.id = blueprint.properties.id;

	if (blueprint.sheetName && blueprint.cell !== undefined) {
		blueprint.properties.cpnSprite = {
			cell: blueprint.cell,
			sheetName: blueprint.sheetName
		};

		delete blueprint.sheetName;
		delete blueprint.cell;
	}

	if (objZoneName !== name)
		blueprint.objZoneName = objZoneName;

	if (mapModule.zone) {
		if ((mapModule.zone.objects) && (mapModule.zone.objects[objZoneName.toLowerCase()]))
			extend(blueprint, mapModule.zone.objects[objZoneName.toLowerCase()]);
		else if ((mapModule.zone.objects) && (mapModule.zone.mobs[objZoneName.toLowerCase()]))
			extend(blueprint, mapModule.zone.mobs[objZoneName.toLowerCase()]);
	}

	if (blueprint.blocking)
		mapModule.collisionMap[blueprint.x][blueprint.y] = 1;

	if ((blueprint.properties.cpnNotice) || (blueprint.properties.cpnLightPatch) || (layerName === 'rooms') || (layerName === 'hiddenRooms')) {
		blueprint.y++;
		blueprint.width = width / mapScale;
		blueprint.height = height / mapScale;
	} else if (width === 24)
		blueprint.x++;

	if (polyline)
		mapObjects.polyline(mapModule.size, blueprint, mapObj, mapScale);

	if (layerName === 'rooms') 
		buildRoom(mapModule, blueprint);
	else if (layerName === 'hiddenRooms') 
		buildHiddenRoom(mapModule, blueprint);
	else if (!clientObj) 
		buildRegularObject(mapModule, blueprint);
	else 
		buildClientObject(mapModule, blueprint);
};

module.exports = buildObject;
