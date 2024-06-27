# SDK Test Setup

Sets up what's needed to run the SDK tests. For now, they are:

- A workspace
- Agent token
- Ensure the token has the right permissions for the test
- Also writes the data to the JS SDK `.env.test` file

## Commands

Assuming you're running from the root of the server project with an environment file ".env.unit-test":
`npx env-cmd -f ".env.unit-test" npx tsx src/tools/sdk-test-setup/index.ts`
