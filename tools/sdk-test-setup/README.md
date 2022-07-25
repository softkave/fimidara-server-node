# SDK Test Setup

Sets up what's needed to run the SDK tests. For now, they are:

- A workspace
- An access token which can be one of:
  - Program access token
  - Client assigned token
- Ensure the token has the right permissions for the test

## Commands

Assuming you're running from the root of the server project with an environment file ".env.local":
`npx env-cmd -f ".env.local" npx ts-node tools/sdk-test-setup/index.ts`
