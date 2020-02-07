const AWS = require('aws-sdk')
const dynamoose = require('dynamoose')

AWS.config.update({
	region: 'us-east-1',
});

dynamoose.local("http://172.16.123.1:4569")

module.exports = (name, schema) => {
	const GenericModel = dynamoose.model(name, schema)
	
	return {
		model: GenericModel,
		create(params) {
			const model = new GenericModel(params)
			
			return model.save()
		}
	}
}