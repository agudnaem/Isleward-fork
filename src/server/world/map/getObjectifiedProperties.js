//In older versions of the Tiled map editor, properties are stored as an object
// whereas newer versions store them as as an array. This helper converts the array
// version in to an object version.

const getObjectifiedProperties = oldProperties => {
	if (!oldProperties || !oldProperties.push)
		return oldProperties || {};

	let newProperties = {};
	oldProperties.forEach(p => {
		newProperties[p.name] = p.value;
	});
			
	return newProperties;
};

module.exports = getObjectifiedProperties;
