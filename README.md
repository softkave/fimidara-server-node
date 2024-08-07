# fimidara

## Server Run Instructions

- Run `npm run dev-mongo-rs` to start mongo-rs. If you changed the configuration of the `dev-mongo-rs` command, make sure to copy the mongo URI of the instance you started into your .env file.
- Setup your `.env.dev` file.
- If you'd like to generate a dev user, run `npx env-cmd -f ".env.dev" npx tsx src/tools/dev-user-setup/index.ts`.
- Run `npm run dev`.

## Server Testing Instructions

- Run `npm run test-mongo-rs` to start mongo-rs.
- Setup your `.env.test` file.
- Run tests.

## Fimidara JS SDK Testing Instructions

In the server root folder:

- Run `npm run test-mongo-rs` to start mongo-rs.
- Setup your `.env.dev` file.
- Run `npx env-cmd -f ".env.dev" npx tsx src/tools/sdk-test-setup/index.ts` to generate test workspace, and token if you don't already have one.
- Run `npm run dev` to start dev instance.

In the JS SDK's root folder:

- Setup `env.test` file.
- Run tests.
