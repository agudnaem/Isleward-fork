define([
	'socket',
	'js/system/events',
	'js/rendering/renderer'
], function (
	io,
	events,
	renderer
) {
	let client = {
		doneConnect: false,

		init: function (onReady) {
			this.socket = io({
				transports: ['websocket']
			});

			this.socket.on('connect', this.onConnected.bind(this, onReady));
			this.socket.on('handshake', this.onHandshake.bind(this));
			this.socket.on('event', this.onEvent.bind(this));
			this.socket.on('events', this.onEvents.bind(this));
			this.socket.on('dc', this.onDisconnect.bind(this));

			Object.entries(this.processAction).forEach(([k, v]) => {
				this.processAction[k] = v.bind(this);
			});
		},

		onConnected: function (onReady) {
			if (this.doneConnect)
				this.onDisconnect();
			else
				this.doneConnect = true;

			if (onReady)
				onReady();
		},

		onDisconnect: function () {
			window.location = window.location;
		},

		onHandshake: function () {
			events.emit('onHandshake');
			this.socket.emit('handshake');
		},

		request: function (msg) {
			this.socket.emit('request', msg, msg.callback);
		},

		processAction: {
			default: function (eventName, msgs) {
				msgs.forEach(m => events.emit(eventName, m));
			},

			rezoneStart: function (eventName, msgs) {
				events.emit('rezoneStart');

				events.emit('destroyAllObjects');
				events.emit('resetRenderer');
				events.emit('resetPhysics');
				events.emit('clearUis');

				client.request({
					threadModule: 'rezoneManager',
					method: 'clientAck',
					data: {}
				});
			},

			getMap: async function (eventName, [msgMap]) {
				await renderer.onGetMap(msgMap);

				events.emit('onGetMap', msgMap);

				client.request({
					threadModule: 'instancer',
					method: 'clientAck',
					data: {}
				});
			},

			onGetObject: function (eventName, msgs) {
				const prepend = msgs.filter(o => o.self);
				msgs.spliceWhere(o => prepend.some(p => p === o));
				msgs.unshift.apply(msgs, prepend);

				this.processAction.default(eventName, msgs);
			}
		},

		onEvent: function ({ event: eventName, data: eventData }) {
			const handler = this.processAction[eventName] || this.processAction.default;

			handler(eventName, [eventData]);
		},

		onEvents: function (response) {
			for (let eventName in response) {
				const eventMsgs = response[eventName];

				const handler = this.processAction[eventName] || this.processAction.default;

				handler(eventName, eventMsgs);
			}
		}
	};

	return client;
});
