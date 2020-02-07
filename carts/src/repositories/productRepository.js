const uuid = require('uuid/v4')
const _genericRepository = require('./_genericRepository')


module.exports = _genericRepository('Cart-Product', {
	id: {
		type: String,
		default: () => uuid()
	},
	name: {
		type: String
	},
	main_picture: String,
	price: {
		from: Number,
		to: Number
	}
});