FROM node:16.15.0-alpine

WORKDIR /app

COPY package.json tsconfig .

RUN NODE_ENV=development yarn --pure-lockfile

COPY src/ ./src

RUN yarn build

ENV NODE_ENV production
EXPOSE 3000
ENTRYPOINT ["yarn", "-s", "start"]