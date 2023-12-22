export default [
	{
		"file": "./http/routes/businesses/spark-plugins/list",
		"method": "get",
		"path": "/b/:businessId/spark-plugins",
		"cors": true,
		"cacheKeys": [],
		"public": true, // TODO: for now
	},
	{
		"file": "./http/routes/businesses/spark-plugins/events",
		"method": "post",
		"path": "/b/:businessId/spark-plugins/:pluginId/events",
		"cors": true,
		"cacheKeys": [],
		"public": true, // TODO: for now
	},
	{
		"file": "./http/routes/matrix/events/get",
		"method": "get",
		"path": "/_matrix/client/v3/rooms/:roomId/event/:eventId",
		"cors": true,
		"cacheKeys": [],
		"public": true, // TODO: for now
	},
	{
		"file": "./http/routes/matrix/events/find",
		"method": "get",
		"path": "/_matrix/client/v3/rooms/:roomId/messages",
		"cors": true,
		"cacheKeys": [],
		"public": true, // TODO: for now
	},
	{
		"file": "./http/routes/matrix/update-state",
		"method": "put",
		"path": "/_matrix/client/v3/rooms/:roomId/state/:eventType/:stateKey",
		"cors": true,
		"cacheKeys": [],
		"public": true, // TODO: for now
	},
	{
		"file": "./http/routes/matrix/send-event",
		"method": "post",
		"path": "/_matrix/client/v3/rooms/:roomId/send/:eventType",
		"cors": true,
		"cacheKeys": [],
		"public": true, // TODO: for now
	},
	{
		"file": "./http/routes/matrix/txns",
		"method": "put",
		"path": "/_matrix/app/v1/transactions/:txnId",
		"cors": true,
		"cacheKeys": [],
		"public": true, // TODO: for now
	},
	{
		"file": "./http/routes/matrix/push/notify",
		"method": "post",
		"path": "/_matrix/push/v1/notify",
		"cors": true,
		"cacheKeys": [],
		"public": true, // TODO: for now
	},
	{
		"file": "./http/routes/matrix/other",
		"method": "get",
		"path": "/_matrix/*",
		"cors": true,
		"cacheKeys": [],
		"public": true, // TODO: for now
	},
	{
		"file": "./http/routes/matrix/other",
		"method": "post",
		"path": "/_matrix/*",
		"cors": true,
		"cacheKeys": [],
		"public": true, // TODO: for now
	},
	{
		"file": "./http/routes/matrix/other",
		"method": "put",
		"path": "/_matrix/*",
		"cors": true,
		"cacheKeys": [],
		"public": true, // TODO: for now
	},
	{
		"file": "./http/routes/matrix/other",
		"method": "delete",
		"path": "/_matrix/*",
		"cors": true,
		"cacheKeys": [],
		"public": true, // TODO: for now
	}
];
