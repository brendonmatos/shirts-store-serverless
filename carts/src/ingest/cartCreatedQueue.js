const AWS = require('aws-sdk')
const sqs = new AWS.SQS()

module.exports = {
	add(product) {
		return sqs.sendMessage({
			QueueUrl: process.env.SQS_CART_CREATED,
			MessageBody: JSON.stringify({
				schema: 'com.shirtstore/product/1-0-0',
				timeOrigin: new Date().toISOString(),
				data: JSON.stringify(product)
			})
		}).promise()
	}
}