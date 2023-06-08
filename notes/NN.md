# NN Designs

## Presigned urls

- Agent token-like tokens that can be passed into queries
  - Uses permission items, expires, and can only have permissions allowed for the issuer. It's also attached to the issuer so should the issuer lose the permissions or be deleted, they are too. Requires expires, and cannot be used for resolve permissions, so the issuer should know what it's for. If used for permission it doesn't have, it'll be black-listed. It should also not be given wildcard access.
- Simple presigned urls for getting files, and in the future, uploading files to.
  - Storage
    - New presigned url store/model/type
    - Agent token with meta
    - Agent token but data structure modified to accomodate issuing agent OR we can use `separateEntityId`.
  - Presentation
    - Pass the ID if using agent token or a resource type
    - Pass a hashed ID
      - Issue with hashing is we cannot reverse it so we also have to save it, so we might as well go with generating and saving a random string.
    - Generate a random string linked to the agent token or presigned url resource
  - Linking the url to the file ID and the permission/action allowed on the file, with other information like the agent token that issued it, expiration date, etc.
  - If issuing agent token loses permission to file or is deleted, presigned url becomes invalid.
    - Auth check method 1, is to make the update when the agent token's permissions are updated, or the token is deleted.
    - Auth check method 2, per presigned url use, check that the token still exists and still has access. May be slower.
    - Auth check method 3, replace performing agent with the issueing agent token cause technically that's who's performing the action. Issue is that it may be hard to pinpoint the exact presigned url if the it's leaked.
  - Presigned url will be used with readFile like filepath. When we get a request, we'll check if it's a singular presigned url (we could also use a marker query), or if it's a filepath. OR we could also create a new endpoint for it, but can be much more work.
  - We'll need a new endpoint for getting presigned urls with options like expiry date-time, etc.
- Super simple presigned url with the file ID, issuing agent token, single-use or multi-use with ot without count, and expiry date.
  - Issue with this approach that the agent token approach solves is access logging, but we currently don't have access logging so it should be okay.
