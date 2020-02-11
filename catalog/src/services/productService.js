const productRepository = require('../repositories/productRepository')
const productCreatedQueue = require('../ingest/productCreatedQueue')

class ProductService {
	async create(productParams) {

		const product = await productRepository.create(productParams)
		
		try {
			await productCreatedQueue.add(product)
		} catch(E) {
			// console.log(E)
		}
		
		return product
	}
	async getById(id) {
		return productRepository.model.get({id})
	}
	find() {
		return productRepository.model.scan().limit(20).exec()
	}
}


module.exports = new ProductService()