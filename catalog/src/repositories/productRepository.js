const uuid = require('uuid/v4')
const _genericRepository = require('./_genericRepository')


module.exports = _genericRepository('Product', {
	id: {
		type: String,
		default: () => uuid()
	},
	name: {
		type: String
	},
	
	description: {
		type: String
	},
	
	pictures: {
		"main": String,
		"secondaries": [ String ]
	},
	
	price: {
		from: Number,
		to: Number
	}
});