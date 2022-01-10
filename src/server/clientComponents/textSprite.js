define([
	'js/rendering/renderer'
], function (
	renderer
) {
	return {
		type: 'textSprite',

		text: null,
		layerName: null,

		sprite: undefined,

		init: function (blueprint) {
			this.buildSprite();
		},

		buildSprite: async function () {
			const { layerName, text, parent: container } = this;

			this.sprite = renderer.buildText({
				layerName,
				text
			});
		},

		update: function () {
			const { sprite, obj } = this;

			if (!sprite) 
				return;

			Object.entries({
				x: (obj.x * scale) + (obj.offsetX || 0),
				y: (obj.y * scale) + (obj.offsetY || 0),
				visible: obj.isVisible
			}).forEach(([k, v]) => {
				if (sprite[k] !== v && v !== undefined)
					sprite[k] = v;
			});

			[
				'text'
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
