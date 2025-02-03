# fimidara server node code

## Server code structure

NOTE: not an exhaustive list.

- `notes/` contains notes about the server, e.g. Roadmap, Bugs, Code structure, Setup, etc.
- `config/` contains configuration files.
- `src/contexts/` contains foundational code for the server, e.g. database connections, caching, etc.
- `src/endpoints/` contains the main entry points for the server, e.g. HTTP routes.
- `src/db/` contains the database models.
- `src/definitions/` contains the definitions of data structures used in the server.
- `src/emailTemplates/` contains the email templates used in the server.
- `src/mddoc/` contains implementation of the tools we use for generating REST API spec, and some parts of the [JS SDK](https://github.com/softkave/fimidara-server-node/tree/main/sdk/js-sdk).
- `src/middleware/` contains Express middleware used in the server.
- `src/resources/` contains config definitions. It's a bit misleading, I know.
- `src/scripts/` is not used for anything right now, but it's used to host scripts that are used to migrate data, etc.
- `src/tools/` contains utility code for working with the server, e.g. dev user setup, sdk test setup, etc.
- `src/utils/` contains utility code used by the server, e.g. fns, etc.
- `src/vitest/` contains [`vitest`](https://vitest.dev/) configurations.
- `src/index.ts` is the entry point for the server.
- `mdoc/` contains generated REST API spec used in the [fimidara Next.js frontend](https://github.com/softkave/fimidara-nextjs).

## JS SDK code structure

[`sdk/js-sdk/`](https://github.com/softkave/fimidara-server-node/tree/main/sdk/js-sdk)  
NOTE: not an exhaustive list.

- `src/cmd/` contains CLI commands available when using the JS SDK as a CLI program, e.g. `fimidara sync`.
- `src/diff/` contains diffing logic between the local file system and fimidara.
- `src/endpoints/` contains API endpoints available when using the JS SDK as a library.
- `src/folder/` contains folder logic for the JS SDK.
- `src/node/` contains Node.js-specific code for the JS SDK.
- `src/path/` contains path handling logic for the JS SDK.
- `src/testutils/` contains test utilities for the JS SDK.
- `src/index.ts` is the isomorphic entry point for the JS SDK.
- `src/indexBrowser.ts` is the browser-specific entry point for the JS SDK.
- `src/indexNode.ts` is the Node.js-specific entry point for the JS SDK.
