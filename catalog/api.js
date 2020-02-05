const cassava = require('cassava')

const router = new cassava.Router();

router.route("/catalog/")
    .method("GET")
    .handler(async evt => {
        return {
            body: "Hello world!"
        };
    });

    
router.route("/hello/{name}")
    .method("GET")
    .handler(async evt => {
        return {
            body: `Hello ${evt.pathParameters["name"]}!`
        };
    });

module.exports.handler = router.getLambdaHandler();