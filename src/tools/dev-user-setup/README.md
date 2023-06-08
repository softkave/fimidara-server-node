# Dev User Setup

Sets up a dev user for testing the client app. It sets up the root workspace (Fimidara) if not yet setup, adds the user if not yet added, and assigns the user the admin permission group. It assumes the admin permission group has all permissions.

## Commands

Assuming you're running from the root of the server project with an environment file `.env.dev`:
`npx env-cmd -f ".env.dev" npx ts-node src/tools/dev-user-setup/index.ts`
