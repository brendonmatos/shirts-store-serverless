const AWS = require('aws-sdk')
const sqs = new AWS.SQS()

module.exports = {
	add(product) {
		return sqs.sendMessage({
			QueueUrl: 'http://172.16.123.1:4576/queue/test_queue',
			MessageBody: JSON.stringify({
				schema: 'com.shirtstore/product/1-0-0',
				timeOrigin: new Date().toISOString(),
				data: JSON.stringify(product)
			})
		}).promise()
	}
}