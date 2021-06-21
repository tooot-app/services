FROM node:14-alpine AS builder

WORKDIR /usr/src/app
COPY ["package.json", "yarn.lock", "tsconfig.json", "./"]
COPY ["src", "./src"]
RUN apk add python3 make gcc g++
RUN yarn install
RUN yarn build

FROM node:14-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ["package.json", "yarn.lock", "./"]
RUN apk --no-cache --virtual build-dependencies add \
  python \
  make \
  gcc \
  g++ \
  && yarn install --production \
  && apk del build-dependencies
COPY --from=builder /usr/src/app/build .
EXPOSE 5000

CMD [ "node", "index.js" ]