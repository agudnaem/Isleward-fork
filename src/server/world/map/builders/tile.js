//Imports
const spriteBuilder = require('../../spriteBuilder/index');

//Builder
const buildTile = (mapModule, tileInfo) => {
	const { x, y, cell, layer: layerName } = tileInfo;

	if (cell === 0) {
		if (layerName === 'tiles')
			mapModule.collisionMap[x][y] = 1;

		return;
	}

	const cellInfo = mapModule.getCellInfo(cell, x, y, layerName);
	if (!tileInfo.sheetName) 
		tileInfo.sheetName = cellInfo.sheetName;

	const offsetCell = spriteBuilder.track(cellInfo);

	const isHiddenLayer = layerName.indexOf('hidden') === 0;

	if (isHiddenLayer)
		mapModule[layerName][x][y] = offsetCell;
	else {
		const layer = mapModule.layers;

		if (mapModule.oldLayers[layerName])
			mapModule.oldLayers[layerName][x][y] = offsetCell;

		layer[x][y] = (layer[x][y] === null) ? offsetCell : layer[x][y] + ',' + offsetCell;

		if (layerName.indexOf('walls') > -1)
			mapModule.collisionMap[x][y] = 1;
		else if (clientConfig.config.blockingTileIndices?.[cellInfo.sheetName]?.includes(cellInfo.cell))
			mapModule.collisionMap[x][y] = 1;
	}
};

module.exports = buildTile;
