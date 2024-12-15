# fimidara server node setup

## Environments

NOTE: the actual `.env` file will vary depending on the environment you are running.

- `.env.dev` for development.
- `.env.unit-test` for unit testing.
- `.env.integration-test` for integration testing.
- `.env` for production.

## Server Setup Instructions

- Download and install Redis at [redis.io](https://redis.io/docs/latest/operate/oss_and_stack/install/).
- Setup your `.env` file. Check `config/custom-environment-variables.json` for the list of variables you need to set.
- Set AWS credentials and other AWS-related variables in your `.env` file.

## Run Development Server

- Run `npm run dev-mongo-rs` to start `mongo-rs`.
- Run `redis-server` to start Redis.
- Run `npx env-cmd -f ".env.dev" npx tsx src/tools/dev-user-setup/index.ts` to generate a dev user if you don't already have one.
- Run `npm run dev`.

## Run Tests

- Run `npm run test-mongo-rs` to start `mongo-rs`.
- Run `redis-server` to start Redis.
- Setup your `.env.test` file.
- Run tests, e.g `npm run test` to run all tests, or `npm run test src/endpoints/folders/addFolder/handler.test.ts` to run a specific test.
