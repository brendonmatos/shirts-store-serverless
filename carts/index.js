const cassava = require('cassava')
// const jwt = require('')
const cartService = require('./src/services/cartService')
const productService = require('./src/services/productService')


const router = new cassava.Router();

router.route("/user/cart")
    .method("PUT")
    .handler(async event => {
    
        const cartId = event.headers['Authorization']
        
        // console.log(cartId)
        
        const updateResult = await cartService.updateContent(cartId, {
            items: event.body.items,
            coupons: event.body.coupons
        })
        
        return {
            statusCode: 200,
            body: {
                "message": "Product registered with success",
                "changed": updateResult
            }
        };
    });

router.route("/user/cart")
    .method("GET")
    .handler(async event => {
        
        const cartId = event.headers['Authorization']
        const cart = await cartService.getOrCreate(cartId)
        
        return {
            statusCode: 200,
            body: cart
        };
        
    });

module.exports.handler = async (event, context) => {
    
    // console.log(event)
    
    if( event.Records && event.Records[0] ) {
        
        const productCreated = JSON.parse(JSON.parse(event.Records[0].body).data)
        
        await productService.create({
            ...productCreated,
            main_picture: productCreated.pictures.main
        })
        
        return {
            statusCode: 200,
            body: "Product Registered in cart Service"
        }
    }
    
    return router.getLambdaHandler()(event,context)
};