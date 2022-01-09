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
			const { layerName, sheetName, cell, parent: container } = this;

			this.sprite = await renderer.buildSpriteAsync({
				sheetName,
				cell,
				container,
				layerName,
				visible: false
			});
		},

		update: function () {
			const { sprite, obj } = this;

			if (!sprite) 
				return;

			Object.entries({
				x: (obj.x * scale) + (obj.offsetX || 0),
				y: (obj.y * scale) + (obj.offsetY || 0),
				visible: obj.isVisible,
				width: obj.width,
				height: obj.height
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
			
		}
	};
});
