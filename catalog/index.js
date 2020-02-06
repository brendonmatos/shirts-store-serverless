const AWS = require('aws-sdk')
const uuid = require('uuid/v4')
const dynamoose = require('dynamoose')
const cassava = require('cassava')
const productCreatedQueue = require('./ingest/productCreatedQueue')


AWS.config.update({
    region: 'us-east-1',
});

dynamoose.local("http://172.16.123.1:4569")

const Product = dynamoose.model('Product', {
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

const router = new cassava.Router();

router.route("/catalog/")
    .method("POST")
    .handler(async event => {
        
        const product = new Product(event.body)
        await product.save()
        
        const createdMessage = await productCreatedQueue.add(product)
        
        return {
            statusCode: 200,
            body: {
                "message": "Product registered with success",
                "created": product,
                "sqsMessage": createdMessage.MessageId
            }
        };
    });

router.route("/catalog/")
    .method("GET")
    .handler(async event => {
        return {
            statusCode: 200,
            body: {
                items: await Product.scan().limit(20).exec(),
            }
        };
    });

module.exports.handler = async (event, context) => {
    
    if( event.Records && event.Records[0].eventSource.indexOf(':sqs') >= 0 ) {
        return {
            statusCode: 500,
            body: "Handler not prepared to receive SQS messages"
        }
    }
    
    return router.getLambdaHandler()(event,context)
};