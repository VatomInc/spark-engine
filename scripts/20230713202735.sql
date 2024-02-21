-- BEGIN UP
CREATE TABLE IF NOT EXISTS spark_plugin (
	id TEXT NOT NULL,
	name TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT(''),
	comm_url TEXT NOT NULL,
	comm_secret TEXT NOT NULL,
	PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS business_spark_plugin (
	business_id TEXT NOT NULL,
	plugin_id TEXT NOT NULL REFERENCES spark_plugin(id)
);
-- END UP

-- BEGIN DOWN
DROP TABLE IF EXISTS business_spark_plugin;
DROP TABLE IF EXISTS spark_plugin;
-- END DOWN
