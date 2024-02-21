
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

