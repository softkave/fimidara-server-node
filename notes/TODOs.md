# TODOs

- Implement provided resource IDs and allow to get permission groups by name
- Implement resource-based access control, not just agent-based access control
- Implement a way to give permission to only delete files that belong to or is created by a token
- Add public default preset
- Change order to weight and it does not have to be unique or provided. We'll have 5 default weights. Lowest will be assigned when one is not provided when assigning presets.
- Implement folder upload and not requiring file name but generating one when not provided
- Use the endpoints instead of directly saving to db
- Write end-to-end tests
- Filter out presets not found, instead of erroring out
- Do we really need buckets?
- Listening on files, compressing files, version, integrity, etags,
  mirror OS file APIs as much as possible, maybe searching and indexing the files and it's content
- Look into using mdb groups-like system for users and tokens
- Improve the API parameters of the endpoints
- Look into the TODOs in the project
- What fields should be indexed in MongoDB?
- Short links for files
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