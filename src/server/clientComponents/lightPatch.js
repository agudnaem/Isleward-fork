define([
	'js/rendering/renderer',
	'js/system/globals'
], function (
	renderer,
	globals
) {
	return {
		type: 'lightPatch',

		color: 'ffeb38',

		patches: [],
		rayContainers: [],
		rays: [],

		init: function (blueprint) {
			const { obj, patches, rayContainers, rays, color, isVisible } = this;
			const { x, y } = obj;

			const maxDistance = Math.sqrt(Math.pow(obj.width / 2, 2) + Math.pow(obj.height / 2, 2));

			for (let i = 0; i < obj.width; i++) {
				for (let j = 0; j < obj.height; j++) {
					const distance = maxDistance - Math.sqrt(Math.pow((obj.width / 3) - i, 2) + Math.pow((obj.width / 3) - j, 2));

					const maxAlpha = (distance / maxDistance) * 0.2;
					if (maxAlpha < 0.05)
						continue;

					const size = (3 + ~~(Math.random() * 6)) * scaleMult;

					const patch = globals.objects.buildObject({
						x: ((x + i) * scale) + (scaleMult * ~~(Math.random() * 4)),
						y: ((y + j) * scale) + (scaleMult * ~~(Math.random() * 4)),
						width: size,
						height: size,
						visible: isVisible,
						components: [{
							type: 'sprite',
							sheetName: 'white',
							cell: 0,
							layerName: 'lightPatches',
							alpha: (maxAlpha * 0.3) + (Math.random() * (maxAlpha * 0.7)),
							tint: '0x' + color,
							blendMode: PIXI.BLEND_MODES.ADD
						}]
					});

					patches.push(patch);
				}
			}

			const rCount = ((obj.width * obj.height) / 10) + ~~(Math.random() + 2);
			for (let i = 0; i < rCount; i++) {
				const nx = x + 3 + ~~(Math.random() * (obj.width - 1));
				const ny = y - 4 + ~~(Math.random() * (obj.height));
				const w = 1 + ~~(Math.random() * 2);
				const h = 6 + ~~(Math.random() * 13);
				const hm = 2;

				const rayContainer = renderer.buildContainer({
					layerName: 'lightBeams'
				});
				rayContainers.push(rayContainer);

				for (let j = 0; j < h; j++) {
					const ray = globals.objects.buildObject({
						x: ~~((nx * scale) - (scaleMult * j)),
						y: (ny * scale) + (scaleMult * j * hm),
						width: w * scaleMult,
						height: scaleMult * hm,
						visible: isVisible,
						components: [{
							type: 'sprite',
							sheetName: 'white',
							cell: 0,
							parent: rayContainer,
							alpha: ((1.0 - (j / h)) * 0.4),
							tint: 0xffeb38,
							blendMode: PIXI.BLEND_MODES.ADD
						}]
					});

					rays.push(ray);
				}
			}
		},

		update: function () {
			const { rays } = this;

			rays.forEach(r => {
				r.alpha += (Math.random() * 0.03) - 0.015;

				if (r.alpha < 0.3)
					r.alpha = 0.3;
				else if (r.alpha > 1)
					r.alpha = 1;
			});
		},

		setVisible: function (isVisible) {
			const { rays, patches } = this;

			rays.forEach(r => {
				r.visible = isVisible;
			});

			patches.forEach(p => {
				p.visible = isVisible;
			});
		}
	};
});
