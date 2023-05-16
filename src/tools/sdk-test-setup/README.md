# SDK Test Setup

Sets up what's needed to run the SDK tests. For now, they are:

- A workspace
- Agent token
- Ensure the token has the right permissions for the test

## Commands

Assuming you're running from the root of the server project with an environment file ".env.dev":
`npx env-cmd -f ".env.dev" npx ts-node src/tools/sdk-test-setup/index.ts`
