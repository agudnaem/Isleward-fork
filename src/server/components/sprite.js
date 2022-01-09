module.exports = {
	type: 'sprite',

	sheetName: null,
	cell: null,
	layerName: 'mobs',

	init: function (blueprint) {
		this.sheetName = blueprint.sheetName;
		this.cell = blueprint.cell;
	},

	simplify: function (self) {
		const { sheetName, cell, layerName } = this;

		return {
			type: 'sprite',
			sheetName,
			cell,
			layerName
		};
	}
};
