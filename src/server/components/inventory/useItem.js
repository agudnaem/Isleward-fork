const isOnCooldown = (obj, cpnInv, item) => {
	if (item.cdMax) {
		if (item.cd) {
			process.send({
				method: 'events',
				data: {
					onGetAnnouncement: [{
						obj: {
							msg: 'That item is on cooldown'
						},
						to: [obj.serverId]
					}]
				}
			});

			return true;
		}

		item.cd = item.cdMax;

		//Find similar items and put them on cooldown too
		cpnInv.items.forEach(function (i) {
			if (i.name === item.name && i.cdMax === item.cdMax)
				i.cd = i.cdMax;
		});
	}
};

module.exports = async (cpnInv, itemId) => {
	let item = cpnInv.findItem(itemId);
	if (!item)
		return;

	let obj = cpnInv.obj;

	if (isOnCooldown(obj, cpnInv, item))
		return;

	let result = {
		ignore: false
	};
	obj.instance.eventEmitter.emit('onBeforeUseItem', obj, item, result);
	obj.fireEvent('onBeforeUseItem', item, result);

	if (result.ignore)
		return;

	let effects = (item.effects || []);
	let eLen = effects.length;
	for (let j = 0; j < eLen; j++) {
		let effect = effects[j];
		if (!effect.events)
			continue;

		let effectEvent = effect.events.onConsumeItem;
		if (!effectEvent)
			continue;

		let effectResult = {
			success: true,
			errorMessage: null
		};

		effectEvent.call(obj, effectResult, item, effect);

		if (!effectResult.success) {
			obj.social.notifySelf({ message: effectResult.errorMessage });

			return;
		}
	}

	if (item.type === 'consumable') {
		if (item.uses) {
			item.uses--;

			if (item.uses) {
				obj.syncer.setArray(true, 'inventory', 'getItems', item);
				return;
			}
		}

		cpnInv.destroyItem(itemId, 1);
		if (item.has('quickSlot'))
			cpnInv.obj.equipment.replaceQuickSlot(item);
	}
};
