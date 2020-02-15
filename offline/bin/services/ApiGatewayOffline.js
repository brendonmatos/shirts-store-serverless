const express = require('express');
const bodyParser = require('body-parser');
const { RequestPayloadBuilder } = require('./RequestPayloadBuilder') 
const { LambdaContext } = require('./LambdaContext');

class ApiGatewayOffline {

    constructor(settings) {
        this.settings = settings;
        this.server = express();
        this.server.use(bodyParser.json());
    }

    _getMethod(method) {
        if (method === 'any') {
            return 'all';
        }
        return method;
    }

    configureHttpListener(event, offlineFunction) {

        const method = this._getMethod(event.http.method)
        const path = event.http.path

        console.log(`API Gateway [${method}]: ${path}`)

        this.server[method](path, async (request, response) => {
            console.log(`Request [${method}]: ${path}`)
            const payload = new RequestPayloadBuilder(request);
            
            const result = await offlineFunction.exec(payload, new LambdaContext(offlineFunction.name, 128));
            response.contentType(result.headers['Content-Type']);
            response.send(result.body);
        });
    }

    configureTriggers(offlineFunction) {
        const {events} = offlineFunction.settings;
        
        // Events
        for (const event of events) {
            if (event.http) {
                this.configureHttpListener(event, offlineFunction)
            }
        }
    }
    boot() {
        return new Promise((resolve, reject) => {
            this.server.listen(3000, () => {
                console.log('API GATEWAY port:', 3000);
                resolve(this.server);
            });
        });
    }
}
exports.ApiGatewayOffline = ApiGatewayOffline;
