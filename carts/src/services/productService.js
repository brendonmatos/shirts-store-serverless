const productRepository = require('../repositories/productRepository')

class ProductService {
	create(productParams) {
		return productRepository.create(productParams)
	}
	async getById(id) {
		return productRepository.model.get({id})
	}
	find() {
		return productRepository.model.scan().limit(20).exec()
	}
}


module.exports = new ProductService()