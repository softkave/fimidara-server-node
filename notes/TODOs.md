# TODOs

- Don't delete program tokens, mark them disabled
- Implement provided resource IDs and allow to get permission groups by name
- Implement resource-based access control, not just agent-based access control
- Implement a way to give permission to only delete files that belong to or is created by a token
- Add public default preset
- Resource-bound tokens, for accessing resources
- Backups
- Pagination
- File versioning
- Byte range
- Use extension when file matching so that users can upload files with the same name but with different extensions
- Change order to weight and it does not have to be unique or provided. We'll have 5 default weights. Lowest will be assigned when one is not provided when assigning presets.
- Implement folder upload and not requiring file name but generating one when not provided
- For public resources, determine what data parts public actions affect, like a folder can be public, but a public agent can't change it from public to private
- Use the endpoints instead of directly saving to db
- Implement notifications
- Implement real time updates
- Update accepted collaboration requests to include the user ID of the recipient for better info in case the user changes their email address
- Write end-to-end tests
- Implement stae-whie-revalidate and other http headers and options
- Implement file versioning, and versioning for other reosurces
- Filter out presets not found, instead of erroring out
- Do we really need buckets?
- Listening on files, compressing files, version, integrity, etags,
  mirror OS file APIs as much as possible, maybe searching and indexing the files and it's content
- Look into using mdb groups-like system for users and tokens
- Improve the API parameters of the endpoints
- Look into the TODOs in the project
- What fields should be indexed in MongoDB?
- Short links for files
- Move from the data provider model to special functions for accessing and operating on data in data providers, primarily so that we can implement a caching mechanism using it. If we can implement the same on top of the current system, that is fine too.
- Skip filenames and generate new ones or appending random strings to filenames
- Pothen name
- Perform existing file check using the file binary / checking that mime is correct using file binary
- Uploading files using parent
- Consider use cases like uploading folders
- Does the user want to override a file or throw an exception if the file exists
- Confirm the places that should be assert split path
- Delete artifacts on resources on delete
- A public page for sharing files and folders
- Error message descriptions
- How do you prevent cyclic preset dependencies among preset permissions?
- Remove unique from schemas and make data unique in handlers
- Make sure that when permission items are being saved, the type matches the resource id,
  and other such checks
- Check that update data has data before saving to db
- Validate that endpoints that define their own name char length should use it in their schemas
- Add nice design to email templates
- Add 404 to NotFoundErrors and appropriate status codes for other error types
- Render error messages if the request requests for it, rather thank just json
- Implement payment, rate limiting, etc.
- Implement moving files and folders accross directories
- Logging and what to log
- Improved image fetch transformers
- Transactions
- Write tests for invalid cases and validations
- Write tests that confirm that agents that shouldn't have access to a resource or
  an operation on a resource shouldn't access it
- Do stress test and check speed and perf
- Use upload preflight call to get an id attached to upload calls for quick check and
  fail upload early. Don't wait until everything is uploaded. See if multer can do this.
- Have a separate upload and download instance
- Add description field for client assigned token
- Recent directories and files feature and bookmarks
- Separate data provider calls to separate functions that you test both mongo and memory
  providers with for pin point testing accuracy
- Add control data to your tests to make sure only intended action happens
- Match returned values for memory and mongo data providers and
  write test for . notation for arrays
- Test that users or agents in organizations don't have access to
  what they shouldn't
- change API passed ids to resource ID
- Test time diff supplied that the full value is saved
- Let users paya for special/configurable memory caching space
- Filesystem file provider
- Cache control for files
- Better action types, so that you can allow people to create tokens but some presets will not be available
- Use the right HTTP errors instead of server error for everything
- use dash instead of camel case for APIs?
- look through other file platforms providers for features to implement
- implement logging with winston
- implement performance logging
- Send email to the recipient of the change in collaboration request
- show time code expires in emails
- allow setting default presets on accept collaboration requests
- implement limit capping based on folder, tag, token, etc
- audit logs
