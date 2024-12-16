# Roadmap

## Server

- image manipulation
- reusable upload
  - set multipart lifecycle in s3
  - usage check using size
  - usage increment using bytes count
  - concurrency with insertJob idempotency check
  - fetch folders and only send to create when not present
  - cleanup parts on delete file
  - complete multipart upload should be a job and should release file when done. this is primarily for memory andlocal fs providers
  - write multiparts to local file and stream to backend when merging
  - flush redis on complete testing, and use different database
  - enforce minimum multipart upload size of 5mb bcos of s3
    - if s3 has a 5mb minimum, then we may need to merge some parts internally
  - add better apis for start, delete part/abort, and end multipart upload
- byte range download
- find a solution to redis shutdowns
- usage revamp
- run sdk tests using redis

## NextJs

- use multipart upload in app
- mdx docs for sdk and rest api
- error pages
- new homepage with features + code
- dev log
