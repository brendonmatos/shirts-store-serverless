const cassava = require('cassava')

const productService = require('./src/services/productService')

const router = new cassava.Router();

// router.route(new cassava.routes.LoggingRoute());

router.route({
    matches: evt => {
        return (evt.httpMethod === "POST" ) &&
            evt.path.indexOf("catalog") >= 0;
    },
    handle: async evt => {
        const product = await productService.create(evt.body)
        return {
            statusCode: 200,
            body: {
                "message": "Product registered with success",
                "created": product
            }
        };
    }
});


router.route({
    matches: evt => {
        return (evt.httpMethod === "GET" ) &&
            evt.path.indexOf("catalog") >= 0;
    },
    handle: async evt => {
        return {
            statusCode: 200,
            body: {
                items: await productService.find()
            }
        };
    }
});

module.exports.handler = async (event, context) => {
    
    // console.log(event)

    if( event.Records && event.Records[0] ) {
        return {
            statusCode: 500,
            body: "Handler not prepared to receive SQS messages"
        }
    }
    
    return router.getLambdaHandler()(event,context)
    //
    // return {
    //     statusCode: 200,
    //     body: JSON.stringify(event)
    // }
    
};