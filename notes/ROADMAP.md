# Roadmap

## Server

- image manipulation
- reusable upload hardening
  - set multipart lifecycle in s3
  - cleanup parts on delete file
  - complete multipart upload should be a job and should release file when done. this is primarily for memory and local fs providers
  - write multiparts to local file and stream to backend when merging
  - flush redis on complete testing, and use different database
  - enforce minimum multipart upload size of 5mb bcos of s3
    - if s3 has a 5mb minimum, then we may need to merge some parts internally
- byte range download
- find a solution to redis shutdowns
- hardening
  - use shard runner for addFolder
    - check if folder exists before sending to shard runner
    - shard runner, who logs errors
  - use shard runner for usage
    - queue in handler by workspaceId + category + operation
  - use shard runner for creating internal multipart ID
    - queue in handler by fileId
    - lock by fileId and get before creating
  - use shard runner for prepare file
    - queue in handler by fileId or filepath
    - lock by fileId or filepath and get before creating
  - concurrency with insertJob idempotency check
  - cache calls to resolveBackendsMountsAndConfigs
  - errors thrown in single runner should return error for that entry
  - errors thrown in multi runner should return error for all entries

## NextJs

- mdx docs for sdk and rest api
- error pages
- new homepage with features + code
- devlog and changelog
- convert last of antd to shadcn
- sidenav on mobile
- usage page
