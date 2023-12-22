# REPLACEME

This project runs an Spark Engine deployed via Kubernetes.

## Setup

Install dependencies:

```bash
yarn
```

Copy and edit config:

```bash
cp .env.template .env
# edit `.env`
```

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
