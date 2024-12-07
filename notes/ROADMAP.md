# Roadmap

## Server

- image manipulation
- reusable upload
  - set multipart lifecycle in s3
  - cache redis parts in memory TTL in-memory cache
  - concurrency issue
    - redlock on upload
    - usage check using size
    - usage increment using bytes count
    - concurrency with create file
    - concurrency with insertJob idempotency check
    - fetch folders and only send to create when not present
    - delete part
    - abort multipart
    - part with set and map
    - cleanup parts on delete file
    - complete code for file contexts
    - write tests for file contexts
    - delete part on overwrite and calculate size well
    - decrement usage on delete file job
    - complete multipart upload should be a job and should release file when done. this is primarily for memory and local fs providers
    - flush redis on complete testing, and use different database
    - enfore minimum multipart upload size of 5mb bcos of s3
    - add better apis for start, delete part/abort, and end multipart upload
    - communicate that -1 is used for lastPart
    - usage records
- byte range download
- find a solution to redis shutdowns
- usage revamp
- redis reconnect
- one redis client for all contexts
- check that read available works for all file providers, local, s3, etc.

## NextJs

- new homepage with features + code
