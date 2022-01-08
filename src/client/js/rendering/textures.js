define([
	
], function (
	
) {
	const loaders = {};

	return {
		getLoader: async path => {
			if (loaders[path])
				return loaders[path];

			loaders[path] = new Promise(async resOuter => {
				let image = null;
				await new Promise(resInner => {
					image = new Image();
					image.onload = resInner;
					image.src = path;
				});

				resOuter(image);
			});

			return loaders[path];
		}
	};
});
