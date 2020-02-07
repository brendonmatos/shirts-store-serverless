const cassava = require('cassava')

const productService = require('./src/services/productService')

const router = new cassava.Router();

router.route("/catalog/")
    .method("POST")
    .handler(async event => {
        const product = await productService.create(event.body)
        return {
            statusCode: 200,
            body: {
                "message": "Product registered with success",
                "created": product
            }
        };
    });

router.route("/catalog/")
    .method("GET")
    .handler(async event => {
        return {
            statusCode: 200,
            body: {
                items: await productService.find(),
            }
        };
    });

module.exports.handler = async (event, context) => {
    
    if( event.Records && event.Records[0] ) {
        return {
            statusCode: 500,
            body: "Handler not prepared to receive SQS messages"
        }
    }
    
    return router.getLambdaHandler()(event,context)
};