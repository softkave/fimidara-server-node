# fimidara server node setup

## Environments and Config

We use [`config`](https://www.npmjs.com/package/config) to manage configurations, and [`env-cmd`](https://www.npmjs.com/package/env-cmd) to manage environment variables. See `package.json` for the list of commands that use `env-cmd`.

Note that the actual `.env` file will vary depending on the environment you are running. Same goes for other config files. See `config/custom-environment-variables.json` for the list of variables you need to set for each environment.

- `.env.dev` for development.
- `.env.unit-test` for unit testing.
- `.env.integration-test` for integration testing.
- `.env` for production.

Other config files are also available. See `src/resources/config.ts` for a full list of configurations.

- `config/default.json` for default config.
- `config/custom-environment-variables.json` for custom environment variables.
- `config/development.json` and `config/local-development.json` for local development config.
- `config/test.json` and `config/local-test.json` for local test config.

## Server Setup Instructions

- Download and install Redis at [redis.io](https://redis.io/docs/latest/operate/oss_and_stack/install/).
- Setup your `.env` file.
- Install dependencies: `npm install`.

## Run Development Server

- Run `npm run dev-mongo-rs` to start `mongo` in replica set mode. We use [`run-rs`](https://www.npmjs.com/package/run-rs) to start the replica set.
- Run `redis-server` to start Redis.
- Setup your `.env.dev` file.
- Run `npx env-cmd -f ".env.dev" npx tsx src/tools/dev-user-setup/index.ts` to generate a dev user or create one manually after starting the server.
- Run `npm run dev`.

## Run Tests

- Run `npm run test-mongo-rs` to start `mongo`.
- Run `redis-server` to start Redis.
- Setup your `.env.unit-test` file.
- Run tests, e.g `npm run test` to run all tests, or `npm run test src/endpoints/folders/addFolder/handler.test.ts` to run a specific test.
