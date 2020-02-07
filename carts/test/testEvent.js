const handler = require('../index').handler

handler({
	"Records": [
		{
			"body": "{\"schema\":\"com.shirtstore/product/1-0-0\",\"timeOrigin\":\"2020-02-06T03:31:53.022Z\",\"data\":\"{\\\"name\\\":\\\"hello world\\\",\\\"price\\\":{\\\"from\\\":10.32,\\\"to\\\":9.2},\\\"pictures\\\":{\\\"main\\\":\\\"http://google.com/logo.png\\\",\\\"secondaries\\\":[\\\"http://google.com/logo.png\\\"]},\\\"description\\\":\\\"sldkfalsdfklasdkflsdfklasdkf asdfsdfasdf\\\",\\\"id\\\":\\\"d22313a6-8d2b-432b-9b5c-8c540d26fd09\\\"}\"}",
			"receiptHandle": "970cfabe-9407-413b-a6e6-0cfabff453eb#1a8773e5-14d4-4626-af8d-c996d7adc373",
			"md5OfBody": "29370e1b77efc5b75781410a877483a6",
			"messageId": "970cfabe-9407-413b-a6e6-0cfabff453eb"
		}
	]
}).then(console.log)