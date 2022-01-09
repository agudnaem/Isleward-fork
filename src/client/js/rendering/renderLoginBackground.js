define([
	'js/system/globals'
], function (
	globals
) {
	const mRandom = Math.random.bind(Math);

	const customRenderer = null;

	const renderCustomLoginBg = async (renderer, path) => {
		if (!customRenderer) {
			await (new Promise(res => {
				require([path], loadedModule => {
					customRenderer = loadedModule;
					res();
				});
			}));
		}

		customRenderer(renderer);
	};

	const renderDefaultLoginBg = renderer => {
		const { width, height, layers } = renderer;

		renderer.setPosition({
			x: 0,
			y: 0
		}, true);

		const w = Math.ceil(width / scale) + 1;
		const h = Math.ceil(height / scale) + 1;

		const midX = ~~(w / 2);
		const midY = ~~(h / 2);

		const rGrass = 10;
		const rBeach = 2;
		const rShallow = 3;
		const rDeeper = 4;

		const noiseFactor = 3;

		const container = layers.tileSprites;

		for (let i = 0; i < w; i++) {
			for (let j = 0; j < h; j++) {
				//Outside part is deep water
				let tile;

				const distance = Math.sqrt(Math.pow(i - midX, 2) + Math.pow(j - midY, 2));
				//Grass
				if (distance < rGrass + (Math.random() * noiseFactor))
					tile = 14;
				//Beach
				else if (distance < rGrass + rBeach + (Math.random() * noiseFactor))
					tile = 8;
				//Shallow water
				else if (distance < rGrass + rBeach + rShallow + (Math.random() * noiseFactor))
					tile = 6;
				//Deeper water
				else if (distance < rGrass + rBeach + rShallow + rDeeper + (Math.random() * noiseFactor))
					tile = 2;
				//Deepest water
				else
					tile = 0;

				let alpha = mRandom();

				if (Math.random() < 0.3) {
					const options = {
						//Grass
						14: [15],
						//Beach
						8: [9],
						//Shallow water
						6: [7, 7, 7, 5],
						//Deeper water
						2: [3, 3, 3, 4, 5],
						//Deepest water
						0: [1, 1, 1, 2]
					}[tile];

					tile = options[~~(Math.random() * options.length)];
				}
				
				const sprite = new PIXI.Sprite(renderer.getTexture('tilesLoginBg', tile));

				alpha = Math.min(Math.max(0.15, alpha), 0.65);

				sprite.alpha = alpha;
				sprite.position.x = i * scale;
				sprite.position.y = j * scale;
				sprite.width = scale;
				sprite.height = scale;

				if (mRandom() < 0.5) {
					sprite.position.x += scale;
					sprite.scale.x = -scaleMult;
				}

				container.addChild(sprite);
			}
		}
	};

	const renderLoginBg = renderer => {
		const { loginBgGeneratorPath } = globals.clientConfig;
		if (loginBgGeneratorPath) {
			renderCustomLoginBg(renderer, loginBgGeneratorPath);

			return;
		}

		renderDefaultLoginBg(renderer);
	};

	return renderLoginBg;
});
