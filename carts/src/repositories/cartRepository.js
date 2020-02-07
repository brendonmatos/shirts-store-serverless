const uuid = require('uuid/v4')
const _genericRepository = require('./_genericRepository')


module.exports = _genericRepository('Cart-Cart', {
	id: {
		type: String,
		default: () => uuid()
	},
	
	coupons: [
		String
	],
	
	items: [
		{
			product: String,
			quantity: {
				type: Number,
				default: () => 1
			},
		}
	]
});