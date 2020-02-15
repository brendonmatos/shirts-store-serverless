const dynalite = require('dynalite');
class DynamoDbOffline {
    constructor() {
        this.port = 4567;
        this.dynaliteServer = dynalite({ path: './mydb', createTableMs: 50 });
        this.arn = 'blablabla';
        this.endpoint = 'http://localhost:' + this.port;
    }


    configureTriggers() {
        // Does nothing 
    }

    boot() {
        return new Promise((resolve, reject) => {
            // Listen on port 4567
            this.dynaliteServer.listen(this.port, (err) => {
                if (err)
                    reject(err);
                console.log('Dynamodb endpoint:', this.port);
                resolve(this);
            });
        });
    }
}
exports.DynamoDbOffline = DynamoDbOffline;
