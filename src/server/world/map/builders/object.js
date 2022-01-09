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

	const { cell } = blueprint;

	if ((cell.width) && (!cell.polyline)) {
		blueprint.width = cell.width / mapScale;
		blueprint.height = cell.height / mapScale;
	}

	const obj = objects.buildObjects([blueprint], true).getSimple(true);
	mapModule.objBlueprints.push(obj);
};

//Builder
const buildObject = (mapModule, layerName, cell) => {
	const { mapScale } = mapModule;

	cell.properties = getObjectifiedProperties(cell.properties);
	cell.polyline = cell.polyline || cell.polygon;

	const x = cell.x / mapScale;
	const y = (cell.y / mapScale) - 1;

	const clientObj = (layerName === 'clientObjects');
	const cellInfo = mapModule.getCellInfo(cell.gid, x, y, layerName);

	let name = (cell.name || '');
	let objZoneName = name;
	if (name.indexOf('|') > -1) {
		const split = name.split('|');
		name = split[0];
		objZoneName = split[1];
	}

	const blueprint = {
		id: cell.properties.id,
		clientObj: clientObj,
		sheetName: cell.isDefined('sheetName') ? cell.sheetName : cellInfo.sheetName,
		cell: cell.isDefined('cell') ? cell.cell : cellInfo.cell - 1,
		x,
		y,
		name: name,
		properties: cell.properties || {},
		layerName: layerName
	};

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
		blueprint.width = cell.width / mapScale;
		blueprint.height = cell.height / mapScale;
	} else if (cell.width === 24)
		blueprint.x++;

	if (cell.polyline) 
		mapObjects.polyline(mapModule.size, blueprint, cell, mapScale);

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
