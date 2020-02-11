const fs = require('fs')
const YAML = require('yaml')
const path = require('path')
const express = require('express')
const dynalite = require('dynalite')
const EventEmitter = require('events')
const bodyParser = require('body-parser')

class RequestPayloadBuilder {
    constructor(request) {


        return {
            "requestContext": {
                "elb": {
                    "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/lambda-279XGJDqGZ5rsrHC2Fjr/49e9d65c45c6791a"
                }
            },
            "body": request.body,
            "httpMethod": request.method,
            "principalId": "",
            "stage": "dev",
            "headers": request.headers,
            "queryStringParameters": request.query,
            "path": request.path,
            "stageVariables": {},
            "isBase64Encoded": false
          }

    }
}

class LambdaContext {
  
    constructor(functionName, memorySize) {
      this.context = {
        awsRequestId: undefined,
        callbackWaitsForEmptyEventLoop: true,
        clientContext: undefined,
        functionName,
        functionVersion: `$LATEST`,
        identity: undefined,
        invokedFunctionArn: `offline_invokedFunctionArn_for_${functionName}`,
        logGroupName: `offline_logGroupName_for_${functionName}`,
        logStreamName: `offline_logStreamName_for_${functionName}`,
        memoryLimitInMB: String(memorySize), // NOTE: string in AWS
      }
    }
  
    setClientContext(clientContext) {
      this.context.clientContext = clientContext
    }
  
    setRequestId(requestId) {
      this.context.awsRequestId = requestId
    }
  
    create() {
      return this.context
    }
  }

class OfflineFunction {
    constructor(settings, name) {
        this.name = name
        this.settings = settings
    }

    _getFunction() {
        const [_path, method] = this.settings.handler.split('.')
        const _module = require(path.join(process.env.PWD, _path))

        if( !method ) {
            return _module
        }

        return _module[method]
    }

    contextualize(stack, root) {
        this.stack = stack
        this.root = root
    }

    exec(payload, context) {

        this.settings.environment = this.settings.environment || {}

        // TODO: create an execution container 
        const environment = { ...this.settings.environment, ...this.root.provider.environment }
        for( const envName in environment ) {
            const envValue = environment[envName]

            if( envValue === '#DYNAMO' ) {
                process.env[envName] = this.stack.dynamoDb.endpoint
                continue    
            }

            if( envValue.Ref ) {
                process.env[envName] = this.stack.sqs.queues[envValue.Ref].endpoint
                continue
            }


            
            process.env[envName] = envValue

        }
        
        return this._getFunction()(payload, context)
    }
    
}

class SQSQueue extends EventEmitter {
    constructor(endpoint, name) {
        super()
        this.endpoint = endpoint + '/' + name
    }
}   

class SQSOffline {
    constructor() {
        this.queues = {}
        this.port = 4568
        this.server = express()
        this.server.use(bodyParser())
    }

    configureResource(name) {
        this.queues[name] = new SQSQueue( `http://localhost:${this.port}`, name)

        return this.queues[name]
    }

    configureEvents(offlineFunction) {
        const events = offlineFunction.settings.events

        for( const event of events ) {
            if( event.sqs ) {
                const name = event.sqs.arn['Fn::GetAtt'][0]

                // TODO: create if not exists

                this.queues[name].on( 'message', (event) => {
                    offlineFunction.exec( {Records: [ {
                        ...event,
                        body: event.MessageBody
                    } ]}, new LambdaContext(name, 128) )
                })
            }
        }
    }

    boot() {
        return new Promise( (resolve, reject) => {
            this.server.use((request, response) => {

                for( const name in this.queues ) {
                    const queueUrlParts = request.body.QueueUrl.split('/')
                
                    if( queueUrlParts[queueUrlParts.length - 1] === name ) {
                        this.queues[name].emit('message', request.body)
                    }
                }
                
                response.end()
            })
            this.server.listen(this.port, () => {
                resolve(this.server)
            })
        })
    }
}

class ApiGatewayOffline {
    constructor(settings) {
        this.settings = settings
        this.server = express()
        this.server.use(bodyParser.json())
    }

    configureEvents(offlineFunction) {
        const events = offlineFunction.settings.events
        
        for( const event of events ) {
            if( event.http ) {
                const getMethod = (method) => {
                    if( method === 'any' ) {
                        return 'all'
                    }
                    return method
                }

                this.server[getMethod(event.http.method)](event.http.path, async (request, response) =>{
                    const payload = new RequestPayloadBuilder(request)
                    
                    const result = await offlineFunction.exec(payload, new LambdaContext(offlineFunction.name, 128))

                    response.contentType(result.headers['Content-Type'])
                    response.send(result.body)
                })
            }
        }

    }

    boot() {
        return new Promise( (resolve, reject) => {
            this.server.listen(3000, () => {
                resolve(this.server)
            })
        })
    }
    
}

class DynamoDbOffline {
    constructor() {
        this.port = 4567
        this.dynaliteServer = dynalite({path: './mydb', createTableMs: 50})
        this.arn = 'blablabla'
        this.endpoint = 'http://localhost:' + this.port
    }

    boot() {
        return new Promise( (resolve, reject) => {
            
            // Listen on port 4567
            this.dynaliteServer.listen(this.port, function(err) {
                if (err) reject(err)
                resolve(this)
            })
        } )
    }

}

class Offline {


    constructor() {
        this.root = {}
        this.stack = {
            apiGateway: new ApiGatewayOffline(),
            dynamoDb: new DynamoDbOffline(),
            sqs: new SQSOffline()
        }

        this.resources = {}
    }

    _getConfigFile() {
        const file = fs.readFileSync('./serverless.yml', 'utf8')
        return YAML.parse(file)
    }

    async addFunctionToStack(offlineFunction) {
        this.stack.apiGateway.configureEvents(offlineFunction)
        // this.stack.s3.configureEvents(offlineFunction)
        this.stack.sqs.configureEvents(offlineFunction)
        // this.stack.dynamoDb.configureEvents(offlineFunction)
    }

    _configureFunctions(object) {
        for( const name in object ) {
            const config = object[name]
            const offlineFunctions = new OfflineFunction(config, name)
            this.addFunctionToStack(offlineFunctions)
            offlineFunctions.contextualize(this.stack, this.root)
        }
    }

    _configureResources(object) {
        for( const name in object ) {
            const config = object[name]
            
            if( config.Type === 'AWS::SQS::Queue' ) {
                this.stack.sqs.configureResource(name, config)
                // TODO: store the returned arn
            }

        }
    }

    _configureServer(config) {
        Object.assign( this.root, config )
        this._configureResources( config.resources.Resources )
        this._configureFunctions( config.functions )
    }

    async _stackBoot() {
        await this.stack.apiGateway.boot()
        await this.stack.dynamoDb.boot()
        await this.stack.sqs.boot()
    }

    static async bootstrap() {
        const offlineServer = new Offline()
        offlineServer._configureServer( offlineServer._getConfigFile() )
        return offlineServer._stackBoot()
    }
}   



Offline.bootstrap().then( () =>{
    console.log( "Server is ready in port 3000" )
} ).catch( error => {
    console.log( error )
} )