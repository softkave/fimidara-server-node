# fimidara server node code

## Server code structure

NOTE: not an exhaustive list, but the most important parts.

- `notes/` contains notes about the server, e.g. Roadmap, etc.
- `config/` contains configuration files.
- `src/contexts/` contains foundational code for the server, e.g. database connections, caching, etc.
- `src/endpoints/` contains the main entry points for the server, e.g. HTTP routes.
- `src/db/` contains the database models and queries.
- `src/definitions/` contains the definitions of the data structures used in the server.
- `src/emailTemplates/` contains the email templates used in the server.
- `src/mddoc/` contains implementation of what we use for generating REST API spec, and some parts of the JS SDK.
- `src/middleware/` contains Express middleware used in the server.
- `src/resources/` contains the config definitions which is a bit misleading.
- `src/scripts/` is not used for anything right now, but it used to host some scripts that are used to migrate data.
- `src/tools/` contains utility code for the server, e.g. dev user setup, etc.
- `src/utils/` contains utility code for the server, e.g. fns, etc.
- `src/vitest/` contains `vitest` configurations.
- `src/index.ts` is the entry point for the server.
- `mdoc/` contains generated REST API spec used in the nextjs frontend.

## JS SDK code structure

NOTE: not an exhaustive list, but the most important parts.

- `src/cmd/` contains the CLI commands for the JS SDK.
- `src/diff/` contains the diffing logic for uploading files for the JS SDK.
- `src/endpoints/` contains the API endpoints for the JS SDK.
- `src/folder/` contains the folder logic for the JS SDK.
- `src/node/` contains the Node.js-specific code for the JS SDK.
- `src/path/` contains the path handling logic for the JS SDK.
- `src/testutils/` contains the test utilities for the JS SDK.
- `src/index.ts` is the entry point for the isomorphic JS SDK.
- `src/indexBrowser.ts` is the entry point for the browser JS SDK.
- `src/indexNode.ts` is the entry point for the Node.js JS SDK.
