const path = require('path');

class OfflineFunction {
    constructor(settings, name) {
        this.name = name;
        this.settings = settings;
    }
    _getFunction() {
        const [_path, method] = this.settings.handler.split('.');
        const _module = require(path.join(process.env.PWD, _path));
        if (!method) {
            return _module;
        }
        return _module[method];
    }
    contextualize(stack) {
        this.stack = stack;
    }
    exec(payload, context) {
        const environment = this.settings.environment;
        for (const envName in environment) {
            const envValue = environment[envName];
            if (envValue === '#DYNAMO') {
                process.env[envName] = this.stack.dynamoDb.endpoint;
                continue;
            }
            if (envValue.Ref) {
                process.env[envName] = this.stack.sqs.queues[envValue.Ref].endpoint;
                continue;
            }
            process.env[envName] = envValue;
        }
        return this._getFunction()(payload, context);
    }
}
exports.OfflineFunction = OfflineFunction;
