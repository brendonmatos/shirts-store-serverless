

const cartRepository = require('../repositories/cartRepository')
const productRepository = require('../repositories/productRepository')
const cartCreatedQueue = require('../ingest/cartCreatedQueue')

class CartService {
	
	constructor() {
	
	}
	
	async create(cartParams) {
		const cart = await cartRepository.create(cartParams)

		try {
			await cartCreatedQueue.add(cart)
		} catch(E) {
			// console.log(E)
		}
		
		return cart
	}
	
	async getById(id) {
		return cartRepository.model.get({id})
	}
	
	find() {
		return cartRepository.model.scan().limit(20).exec()
	}
	
	async getOrCreate(cartId) {
		
		let cart = await this.getById(cartId)
		
		if( !cart ) {
			cart = await this.create({
				coupons: [],
				items: []
			})
		}
		
		return cart
	}
	
	// TODO: comment
	getValidProducts(items) {
		const productIds = Array.from( new Set( items ) )
		
		return productRepository.model.scan({'id': { in: productIds}}).exec()
	}
	
	// TODO: comment
	async updateContent (id, content) {
		const cart = await this.getOrCreate(id)

		const validProducts = await this.getValidProducts( content.items.map( item => item.product ) )
		
		const validProductsIds = validProducts.map( product => product.id )
		
		cart.items = content.items.filter( item => validProductsIds.includes(item.product) )
		
		// TODO: implement coupons
		cart.coupons = []
		
		return cart.save()
	}
}


module.exports = new CartService()