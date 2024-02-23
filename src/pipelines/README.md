# fimidara Pipelines

Current pipelines are:

- aggregate-usage-records
  - Aggregates usage records and locks certain requests if threshold is exceeded.
- unlock-usage-threshold-locks
  - Unlocks locked usage categories.

## Commands

Assuming you're running from the root of the server project with an environment file ".env.dev":
`npx env-cmd -f ".env.dev" npx ts-node src/pipelines/index.ts`

Run aggregate-usage-records with an environment file ".env.dev":
`npx env-cmd -f ".env.dev" npx ts-node src/pipelines/aggregate-usage-records/index.ts`

Run unlock-usage-threshold-locks with an environment file ".env.dev":
`npx env-cmd -f ".env.dev" npx ts-node src/pipelines/unlock-usage-threshold-locks/index.ts`
