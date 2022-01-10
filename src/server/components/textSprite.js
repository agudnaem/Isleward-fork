module.exports = {
	type: 'textSprite',

	text: 'test text, please ignore',
	layerName: 'effects',

	init: function (blueprint) {
		this.text = blueprint.text;
	},

	simplify: function (self) {
		const { text, layerName } = this;

		return {
			type: 'textSprite',
			text,
			layerName
		};
	}
};
