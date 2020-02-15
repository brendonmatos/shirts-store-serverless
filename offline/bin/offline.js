const fs = require('fs')
const YAML = require('yaml')

const { RequestPayloadBuilder } = require("./services/RequestPayloadBuilder")
const { LambdaContext } = require("./services/LambdaContext")
const { OfflineFunction } = require("./services/OfflineFunction")
const { SQSOffline } = require("./services/SQSOffline")
const { DynamoDbOffline } = require("./services/DynamoDbOffline")
const { ApiGatewayOffline } = require("./services/ApiGatewayOffline")


class OfflineStack {
    constructor() {
        this.resources = {
            apiGateway: new ApiGatewayOffline(),
            dynamoDb: new DynamoDbOffline(),
            sqs: new SQSOffline(),
            s3: new class{ 
                configureTriggers() {

                }

                boot() {

                }
            }
        }
    }

    configureResources(resources) {
        for( const resource of resources ) {
            if( resource.config.Type === 'AWS::SQS::Queue' ) {
                this.resources.sqs.configureResource(resource.name, resource.config)
                // TODO: store the returned arn
            }
        }
    }

    addFunction( functionName, functionSettings ) {
        const offlineFunction = new OfflineFunction( functionSettings, functionName )
        offlineFunction.contextualize(this.resources)
        this.resources.apiGateway.configureTriggers(offlineFunction)
        this.resources.s3.configureTriggers(offlineFunction)
        this.resources.sqs.configureTriggers(offlineFunction)
        this.resources.dynamoDb.configureTriggers(offlineFunction)
    }

    async boot() {
        await this.resources.apiGateway.boot()
        await this.resources.s3.boot()
        await this.resources.sqs.boot()
        await this.resources.dynamoDb.boot()
    }
}

class OfflineAws {

    constructor() {
        this.root = {}
        this.stack = new OfflineStack()
    }

    _getConfigFile() {
        const file = fs.readFileSync('./serverless.yml', 'utf8')
        return YAML.parse(file)
    }


    configureFunctions(object) {
        for( const name in object ) {
            const config = object[name]
            this.stack.addFunction(name, {
                ...config,
                environment: {
                    ...config.environment,
                    ...this.root.provider.environment
                }
            })
        }
    }

    configureResources(object) {
        const resources = []

        for( const name in object ) {
            const config = object[name]

            let type;
            if( config.Type === 'AWS::SQS::Queue' ) {
                type = 'sqs'
            }

            if( !type ) {
                throw new Error('Settings for resource are not supported: '+ JSON.stringify(config))
            }

            resources.push({
                name,
                type,
                config: object[name]
            })
        }
    
        return this.stack.configureResources(resources)

    }
    
    configureServer(config) {
        Object.assign( this.root, config )
        this.configureResources( config.resources.Resources )
        this.configureFunctions( config.functions )
    }


    static async bootstrap() {
        const offlineServer = new OfflineAws()
        offlineServer.configureServer( offlineServer._getConfigFile() )

        return offlineServer.stack.boot()
    }
}   



OfflineAws.bootstrap().then( () =>{
    console.log( "Server is ready in port 3000" )
} ).catch( error => {
    console.log( error )
} )