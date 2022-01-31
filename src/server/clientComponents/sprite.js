define([
	'js/rendering/renderer'
], function (
	renderer
) {
	return {
		type: 'sprite',

		alpha: 1,
		tint: undefined,
		layerName: undefined,
		sheetName: undefined,

		sprite: undefined,

		init: function (blueprint) {
			this.buildSprite();
		},

		buildSprite: async function () {
			const { layerName, sheetName, cell, container } = this;

			this.sprite = await renderer.buildSpriteAsync({
				sheetName,
				cell,
				container,
				layerName,
				spriteConfig: {
					visible: false
				}
			});
		},

		update: function () {
			const { sprite, obj } = this;

			if (!sprite)
				return;

			let x = (obj.x * scale) + (obj.offsetX || 0);
			let y = (obj.y * scale) + (obj.offsetY || 0);

			const width = (obj?.transform?.width ?? obj.width) * scaleMult;
			const height = (obj?.transform?.height ?? obj.height) * scaleMult;

			Object.entries({
				x,
				y,
				visible: obj.isVisible,
				width: width,
				height: height
			}).forEach(([k, v]) => {
				if (sprite[k] !== v && v !== undefined)
					sprite[k] = v;
			});

			[
				'alpha',
				'tint'
			].forEach(p => {
				const value = this[p];

				if (sprite[p] !== value && value !== undefined)
					sprite[p] = value;
			});
		},

		destroy: function () {
			const { sprite } = this;

			if (!sprite)
				return;

			sprite.parent.removeChild(sprite);
		}
	};
});
