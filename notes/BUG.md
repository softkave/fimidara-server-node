## NextJs

- toggle all should toggle all permission and untoggling one should untoggle all
- deleted file not removed from list. check folder too
- only text navigates not menu in sidenav, and other menus not navigated to get selected
  - click text does not open children menu
- in error page, only surface error's marked public. error page per section,
  like public/logged-in. report errors to like sentry or logs. recover page from errors.
- bug in usage records
  - pagination
- mobile rendering
  - sidenav
- convert last of message to toast
- convert last of antd to shadcn
  - pagination
- error in assign permissions modal
- waitlisted user message not centered
  - make sure all content are horizontally and vertically centered
- loading and nothing found rendering together
- opening permissions for a folder first shows no permission groups
- server error not shown in fields
- input outline is truncated

## CLI

- close file descriptors

## Server

- unauthorized error from express-jwt, also means middleware not working
- check that creating folders/files with presigned paths is successful
- MongoDb transaction error crashing the server
- Redis connection error crashing the server
