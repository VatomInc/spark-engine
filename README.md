
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


## License

MIT License

Copyright (c) 2023 Vatom

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


