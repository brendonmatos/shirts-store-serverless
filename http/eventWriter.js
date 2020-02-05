

const aws = require('aws-sdk');
const cassava = require('cassava');

const router = new cassava.Router();

router.route("/event-writer/")
	.method("GET")
	.handler(async evt => {
		
		const sqs = new aws.SQS()
		
		const result = await sqs.sendMessage({
			QueueUrl: 'http://localhost:4576/queue/test_queue',
			MessageBody: JSON.stringify({
				schema: 'com.shirtstore/1-0-0',
				timeOrigin: new Date().toISOString(),
				data: JSON.stringify(evt)
			})
		}).promise()
		
		
		console.log(result)
		
		return {
			body: "Hello world!"
		};
	});

module.exports.handler = router.getLambdaHandler();