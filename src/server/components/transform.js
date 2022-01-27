module.exports = {
	type: 'transform',

	width: null,
	height: null,

	init: function (blueprint) {
		this.width = blueprint.width;
		this.height = blueprint.height;
	},

	simplify: function (self) {
		const { width, height } = this;

		return {
			type: 'transform',
			width,
			height
		};
	}
};
