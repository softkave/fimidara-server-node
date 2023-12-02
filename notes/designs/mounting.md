# Mounting Backends

## Requirements

- Allow users mount external backends, starting with AWS S3
- Allow users select where they want to mount to, so a folderpath under which the contents of the backend will be accessible
- Allow users select where they want to mount from, so for AWS S3, like a bucket or folderpath in a bucket
- Allow users specify mount index, allowing them mount multiple backends to the same folderpath
- Folders should inherit parent folders mounted backends
- For each file operation, we ingest the file, then perform operation
- For each folder operation except
