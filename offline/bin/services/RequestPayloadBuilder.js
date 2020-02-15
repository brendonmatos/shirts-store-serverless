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
        };
    }
}

exports.RequestPayloadBuilder = RequestPayloadBuilder