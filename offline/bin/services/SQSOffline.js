const express = require('express');
const bodyParser = require('body-parser');
const { LambdaContext } = require("./LambdaContext");
const EventEmitter = require('events')

class SQSQueue extends EventEmitter {
    constructor(endpoint, name) {
        super()
        this.endpoint = endpoint + '/' + name

        console.log('SQS Queue port:', this.endpoint)
    }
}   


class SQSOffline {
    constructor() {
        this.queues = {};
        this.port = 4568;
        this.server = express();
        this.server.use(bodyParser());
    }
    configureResource(name) {
        this.queues[name] = new SQSQueue(`http://localhost:${this.port}`, name);
        return this.queues[name];
    }
    configureTriggers(offlineFunction) {
        const events = offlineFunction.settings.events;
        for (const event of events) {
            if (event.sqs) {
                const name = event.sqs.arn['Fn::GetAtt'][0];
                // TODO: create if not exists
                this.queues[name].on('message', (event) => {
                    offlineFunction.exec({
                        Records: [{
                            ...event,
                            body: event.MessageBody
                        }]
                    }, new LambdaContext(name, 128));
                });
            }
        }
    }
    boot() {
        return new Promise((resolve, reject) => {
            this.server.use((request, response) => {
                for (const name in this.queues) {
                    const queueUrlParts = request.body.QueueUrl.split('/');
                    if (queueUrlParts[queueUrlParts.length - 1] === name) {
                        this.queues[name].emit('message', request.body);
                    }
                }
                response.end();
            });
            this.server.listen(this.port, () => {
                console.log('SQS port:', this.port);
                resolve(this.server);
            });
        });
    }
}
exports.SQSOffline = SQSOffline;
