//Imports
const jimp = require('jimp');

//System
let mapName = null;
let stage = null;
let noFlipTiles = null;
let tileOpacities = null;

//Methods
const init = _mapName => {
	mapName = _mapName;
	stage = [];
	noFlipTiles = [];
	tileOpacities = [];
};

const track = tileInfo => {
	const { cell, sheetName } = tileInfo;

	if (!sheetName || cell === undefined)
		return cell;

	const existIndex = stage.findIndex(s => s.cell === cell && s.sheetName === sheetName);
	if (existIndex !== -1)
		return existIndex + 1;

	stage.push({
		cell,
		sheetName
	});

	const { config: { tilesNoFlip: noFlip, tileOpacities: opacities } } = clientConfig;

	if (noFlip?.[sheetName]?.includes(cell - 1))
		noFlipTiles.push(stage.length);

	tileOpacities.push({
		max: opacities?.[sheetName]?.max ?? opacities.default.max,
		opacity: opacities?.[sheetName]?.[cell - 1] ?? opacities?.[sheetName]?.default ?? opacities.default.default
	});

	return stage.length;
};

const getPath = () => {
	const path = `images/temp/${mapName}.png`;

	return path;
};

const finalize = async () => {
	const pathMaps = {};

	const paths = [];
	stage.forEach(s => {
		const sheetName = s.sheetName;

		const path = sheetName.includes('.png') ? `../${sheetName}` : `../client/images/${sheetName}.png`;

		if (paths.includes(path))
			return;

		pathMaps[sheetName] = path;

		paths.push(path);
	});

	const loaders = await Promise.all(paths.map(p => jimp.read(p)));

	//Load images
	const images = await Promise.all(loaders);

	const w = 8 * 8;
	const h = Math.ceil(stage.length / 8) * 8;

	//Create new
	const res = new jimp(w, h, async (err, image) => {
		stage.forEach(({ sheetName, cell }, i) => {
			const mappedPath = pathMaps[sheetName];
			const imageIndex = paths.findIndex(p => p === mappedPath);
			const sourceImage = images[imageIndex];

			const y = ~~(i / 8);
			const x = i - (y * 8);

			const sy = ~~((cell - 1) / 8);
			const sx = cell - 1 - (sy * 8);

			image.blit(sourceImage, x * 8, y * 8, sx * 8, sy * 8, 8, 8);
		});

		const path = `../client/${getPath()}`;

		image.writeAsync(path);
	});

	return res;
};

const getNoFlipTiles = () => {
	return noFlipTiles;
};

const getTileOpacities = () => {
	return tileOpacities;
};

//Exports
module.exports = {
	init,
	track,
	getPath,
	getNoFlipTiles,
	getTileOpacities,
	finalize
};
