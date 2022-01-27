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

		position: 'under',

		init: function (blueprint) {
			this.buildSprite();
		},

		buildSprite: async function () {
			const { layerName, text, container } = this;

			this.sprite = renderer.buildTextSprite({
				layerName,
				container,
				text
			});
		},

		getPosition: function () {
			const { obj: { x, y, height, offsetX, offsetY }, position, sprite } = this;

			const width = this.obj.transform.width * scaleMult;
			let rx = (x * scale);
			let ry = (y * scale);

			if (position === 'under') {
				rx += (width / 2) - (sprite.width / 2);
				ry += height;
			}

			if (offsetX)
				rx += offsetX;

			if (offsetY)
				ry += offsetY;

			return { x: rx, y: ry };
		},

		update: function () {
			const { sprite, obj } = this;

			if (!sprite) 
				return;

			const { x, y } = this.getPosition();

			Object.entries({
				x,
				y,
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
