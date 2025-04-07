## Next.js client

- prevent closing of modal when clicking outside when it's loading
- toggle all should toggle all permission and untoggling one should untoggle all
- in error page, only surface error's marked public. error page per section,
  like public/logged-in. report errors to like sentry or logs. recover page from errors.
- error in assign permissions modal
- waitlisted user message not centered
  - make sure all content are horizontally and vertically centered
- loading and nothing found rendering together
- opening permissions for a folder first shows no permission groups
- server error not shown in fields
- input outline is truncated
- server error when uploading large file, also it doesn't stop the upload
- error page & component should only show public errors, and default to showing a generic error message
- infinite loop on redirect
- oauth sign-in not working

## CLI

- close file descriptors

## Server

- check that creating folders/files with presigned paths is successful
- when using local and running dev, the downloaded file from multipart upload is not the same as the original file

## JS SDK

- end upload when at least one part fails
