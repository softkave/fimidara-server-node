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
- byte range download
- find a solution to redis shutdowns
- usage revamp
- redis reconnect
- one redis client for all contexts

## NextJs

- new homepage with features + code
