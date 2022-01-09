define([
	'js/rendering/renderer'
], function (
	renderer
) {
	return {
		type: 'sprite',

		sprite: null,

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

			[
				'x',
				'y',
				'visible',
				'width',
				'height'
			].forEach(p => {
				const value = obj[p];

				if (sprite[p] !== value)
					sprite[p] = value;
			});

			[
				'alpha',
				'tint'
			].forEach(p => {
				const value = this[p];

				if (sprite[p] !== value)
					sprite[p] = value;
			});
		},

		destroy: function () {
			
		}
	};
});
