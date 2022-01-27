define([
	'js/rendering/rendererLegacy'
], function (
	rendererLegacy
) {
	const renderer = {
		...rendererLegacy,

		buildSpriteAsync: async function (config) {
			const { sheetName, cell, container, layerName, spriteConfig } = config;

			const sprite = new PIXI.Sprite();

			if (spriteConfig) {
				for (let p in spriteConfig)
					sprite[p] = spriteConfig[p];
			}

			const textureExists = this.textures.hasOwnProperty(sheetName);
			if (!textureExists)
				await this.loadTexture(sheetName);

			sprite.texture = this.getTexture(sheetName, cell);

			const spriteContainer = container || this.layers[layerName || sheetName];
			spriteContainer.addChild(sprite);

			return sprite;
		},

		buildTextSprite: function (config) {
			const { text, container, layerName, fontSize = 14, color = 0xF2F5F5 } = config;

			const textSprite = new PIXI.Text(text, {
				fontFamily: 'bitty',
				fontSize: fontSize,
				fill: color,
				stroke: 0x2d2136,
				strokeThickness: 4,
				align: 'center'
			});

			const parentSprite = container || this.layers[layerName];
			parentSprite.addChild(textSprite);

			return textSprite;
		}
	};

	return renderer;
});
