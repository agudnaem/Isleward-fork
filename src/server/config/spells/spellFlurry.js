define([

], function (

) {
	return {
		type: 'flurry',

		cdMax: 7,
		manaCost: 0,

		range: 9,

		speed: 150,
		damage: 1,

		row: 3,
		col: 0,
		aura: true,

		cast: function (action) {
			var obj = this.obj;

			this.sendBump(obj);

			this.queueCallback(this.explode.bind(this, obj), 1, null, obj);

			this.sendBump({
				x: obj.x,
				y: obj.y - 1
			});

			return true;
		},
		explode: function (obj) {
			if (this.obj.destroyed)
				return;

			this.obj.spellbook.spells[0].cd = 0;
			this.obj.effects.addEffect({
				type: 'frenzy',
				ttl: this.duration,
				newCd: 1
			});
		}
	};
});
