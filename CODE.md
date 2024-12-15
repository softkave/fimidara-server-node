# fimidara server node code

## Server code structure

NOTE: not an exhaustive list.

- `notes/` contains notes about the server, e.g. Roadmap, etc.
- `config/` contains configuration files.
- `src/contexts/` contains foundational code for the server, e.g. database connections, caching, etc.
- `src/endpoints/` contains the main entry points for the server, e.g. HTTP routes.
- `src/db/` contains the database models and queries.
- `src/definitions/` contains the definitions of the data structures used in the server.
- `src/emailTemplates/` contains the email templates used in the server.
- `src/mddoc/` contains implementation of what we use for generating REST API spec, and some parts of the [JS SDK](https://github.com/softkave/fimidara-server-node/tree/main/sdk/js-sdk).
- `src/middleware/` contains Express middleware used in the server.
- `src/resources/` contains the config definitions. It's a bit misleading, I know.
- `src/scripts/` is not used for anything right now, but it used to host some scripts that are used to migrate data.
- `src/tools/` contains utility code for working with the server, e.g. dev user setup, sdk test setup, etc.
- `src/utils/` contains utility code used by the server, e.g. fns, etc.
- `src/vitest/` contains [`vitest`](https://vitest.dev/) configurations.
- `src/index.ts` is the entry point for the server.
- `mdoc/` contains generated REST API spec used in the [fimidara Next.js frontend](https://github.com/softkave/fimidara-nextjs).

## JS SDK code structure

[`sdk/js-sdk/`](https://github.com/softkave/fimidara-server-node/tree/main/sdk/js-sdk)  
NOTE: not an exhaustive list.

- `src/cmd/` contains the CLI commands available when using the JS SDK as a CLI program, e.g. `fimidara sync`.
- `src/diff/` contains the diffing logic between the local file system and the fimidara server.
- `src/endpoints/` contains the API endpoints available when using the JS SDK as a library.
- `src/folder/` contains the folder logic for the JS SDK.
- `src/node/` contains the Node.js-specific code for the JS SDK.
- `src/path/` contains the path handling logic for the JS SDK.
- `src/testutils/` contains the test utilities for the JS SDK.
- `src/index.ts` is the isomorphic entry point for the JS SDK.
- `src/indexBrowser.ts` is the browser-specific entry point for the JS SDK.
- `src/indexNode.ts` is the Node.js-specific entry point for the JS SDK.
