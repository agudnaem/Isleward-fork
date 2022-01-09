define([
	'js/system/globals'
], function (
	globals
) {
	return {
		sprites: {},

		init: async function () {
			const { sprites } = this;
			const { clientConfig: { textureList } } = globals;

			return Promise.all(textureList.map(s => {
				return new Promise(res => {
					const spriteSource = s.includes('.png') ? s : `images/${s}.png`;

					const sprite = new Image();
					sprites[s] = sprite;
					sprite.onload = res;
					sprite.src = spriteSource;
				});
			}));
		}
	};
});
