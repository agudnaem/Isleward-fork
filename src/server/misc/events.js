module.exports = {
	events: {},

	on: function (event, callback) {
		let list = this.events[event] || (this.events[event] = []);
		list.push(callback);

		return callback;
	},

	off: function (event, callback) {
		let list = this.events[event] || [];
		let lLen = list.length;
		for (let i = 0; i < lLen; i++) {
			if (list[i] === callback) {
				list.splice(i, 1);
				i--;
				lLen--;
			}
		}

		if (lLen === 0)
			delete this.events[event];
	},

	emit: function (event) {
		let args = [].slice.call(arguments, 1);

		let list = this.events[event];
		if (!list)
			return;

		let len = list.length;
		for (let i = 0; i < len; i++) {
			let l = list[i];
			l.apply(null, args);
		}
	},

	//In the future, all events should be non sticky
	emitNoSticky: function (event) {
		let args = [].slice.call(arguments, 1);

		let list = this.events[event];
		if (!list)
			return;

		let len = list.length;
		for (let i = 0; i < len; i++) {
			let l = list[i];
			l.apply(null, args);
		}
	}
};
