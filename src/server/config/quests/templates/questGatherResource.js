define([
	'items/generators/slots'
], function (
	slots
) {
	return {
		type: 'gatherResource',

		need: null,
		type: null,
		requiredQuality: 0,
		have: 0,

		build: function () {
			if (!this.need) {
				this.need = 2 + ~~(Math.random() * 3);

				this.type = ['herb', 'fish'][~~(Math.random() * 2)];

				if (this.type == 'fish') {
					this.name = 'Lure of the Sea';

					var isQualityQ = (Math.random() < 0.3);
					if (isQualityQ) {
						this.requiredQuality = 1 + ~~(Math.random() * 2);
						this.need = 1;
					}
				}
			}

			if (!this.type)
				this.type = 'herb';

			this.typeName = (this.type == 'herb') ? 'herbs' : 'fish';

			this.updateDescription();

			return true;
		},

		updateDescription: function () {
			var typeName = this.typeName;
			if (this.requiredQuality > 0)
				typeName = ['big', 'giant'][this.requiredQuality - 1] + ' ' + typeName;

			var action = ({
				herb: 'Gather',
				fish: 'Catch'
			})[this.type];

			this.description = `${action} ${this.have}/${this.need} ${typeName}`;
		},

		events: {
			afterGatherResource: function (gatherResult) {
				if (gatherResult.nodeType != this.type)
					return;
				else if ((this.requiredQuality) && (gatherResult.items[0].quality != this.requiredQuality))
					return;

				if ((this.obj.zoneName != this.zoneName) || (this.have >= this.need))
					return;

				this.have++;
				this.updateDescription();

				this.obj.syncer.setArray(true, 'quests', 'updateQuests', this.simplify(true));

				if (this.have >= this.need)
					this.ready();
			}
		}
	};
});
