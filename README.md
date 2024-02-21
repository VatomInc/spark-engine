
# Spark Engine

## About

The Spark Engine brokers communication between the client (e.g. Vatom Wallet) and the external Spark Plugin servers. It secures the communication to authorized plugin providers and prevents end user credentials from being sent to the external system. 

The Spark Engine also provides an API into the underlying Matrix server.

## Installation

Install dependencies:

```bash
yarn
```

Copy and edit config:

```bash
cp .env.template .env
# edit `.env`
```

### Creating a database

Install a postgres database and run the database scripts in /scripts. Specify the PGCONN connection string in your .env file.

## Local Development

```
yarn build
yarn start
```

Or, using hot reloading (recommended)...

```bash
# in two terminals
yarn build:watch
yarn start:watch
```

## Documentation

### Registering a Plugin

When a plugin is deployed, the Vatom platform needs to know the URL of the plugin endpoint and needs a way to secure the communication. Each plugin must be added to the spark_plugin table as follows:

* id - a unique primary key (e.g. nanoid)
* name - a friendly name for the plugin
* description - an optional description for the plugin
* comm_url - the public URL for the plugin
* comm_secret - a secret that will be used to sign the messages

Once this is done, the plugin should be associated to your Vatom business:

* business_id - the id of your Vatom business
*	plugin_id - the id of the plugin in the spark_plugin table

