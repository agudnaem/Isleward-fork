define([
	'js/system/client',
	'ui/factory',
	'js/rendering/renderer',
	'js/objects/objects',
	'js/rendering/effects',
	'js/rendering/numbers',
	'js/input',
	'js/system/events',
	'js/resources',
	'js/sound/sound',
	'js/system/globals',
	'js/components/components',
	'ui/templates/online/online',
	'ui/templates/tooltips/tooltips'
], function (
	client,
	uiFactory,
	renderer,
	objects,
	effects,
	numbers,
	input,
	events,
	resources,
	sound,
	globals,
	components
) {
	let fnQueueTick = null;
	const getQueueTick = updateMethod => {
		return () => requestAnimationFrame(updateMethod);
	};

	return {
		hasFocus: true,

		lastRender: 0,
		msPerFrame: ~~(1000 / 60),

		init: function () {
			if (isMobile)			
				$('.ui-container').addClass('mobile');

			client.init(this.onClientReady.bind(this));
		},

		onClientReady: function () {
			client.request({
				module: 'clientConfig',
				method: 'getClientConfig',
				callback: this.onGetClientConfig.bind(this)
			});
		},

		onGetClientConfig: async function (config) {
			globals.clientConfig = config;

			await resources.init();
			events.emit('onResourcesLoaded');

			await components.init();

			this.start();
		},

		start: function () {
			window.onfocus = this.onFocus.bind(this, true);
			window.onblur = this.onFocus.bind(this, false);

			$(window).on('contextmenu', this.onContextMenu.bind(this));

			sound.init();

			objects.init();
			renderer.init();
			input.init();

			numbers.init();

			uiFactory.init(null, globals.clientConfig.uiList);
			uiFactory.build('login', 'body');

			fnQueueTick = getQueueTick(this.update.bind(this));
			fnQueueTick();

			$('.loader-container').remove();
		},

		onFocus: function (hasFocus) {
			//Hack: Later we might want to make it not render when out of focus
			this.hasFocus = true;

			if (!hasFocus)
				input.resetKeys();
		},

		onContextMenu: function (e) {
			const allowed = ['txtUsername', 'txtPassword'].some(s => $(e.target).hasClass(s));
			if (!allowed) {
				e.preventDefault();
				return false;
			}
		},

		update: function () {
			const time = +new Date();
			if (time - this.lastRender < this.msPerFrame - 1) {
				fnQueueTick();

				return;
			}

			objects.update();
			renderer.update();
			uiFactory.update();
			numbers.update();

			renderer.render();

			this.lastRender = time;

			fnQueueTick();
		}
	};
});
