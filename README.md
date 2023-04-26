# fimidara

## Server Run Instructions

- Run `npm run start-mongo-rs` to start mongo-rs. If you changed the configuration of the `start-mongo-rs` command, make sure to copy the mongo URI of the instance you started into your .env file.
- Setup your `.env.local` file after the `example-env-file` if not already done.
- If you'd like to generate a dev user, run `npx env-cmd -f ".env.local" npx ts-node src/tools/dev-user-setup/index.ts`.
- Run `npm run dev`.

## Server Testing Instructions

- Run `npm run start-mongo-rs` to start mongo-rs.
- Setup your `.env.test` file after the `example-env-file` if not already done.
- Run tests.

## Fimidara JS SDK Testing Instructions

In the server root folder:

- Run `npm run start-mongo-rs` to start mongo-rs.
- Setup your `.env.local` file after the `example-env-file` if not already done.
- Run `npx env-cmd -f ".env.local" npx ts-node src/tools/sdk-test-setup/index.ts` to generate test workspace, and token if you don't already have one.
- Run `npm run dev` to start dev instance.

In the JS SDK's root folder:

- Setup `env.test` file after the `example-env-file` if not already setup.
- Run tests.
