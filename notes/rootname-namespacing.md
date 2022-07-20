# Workspace root name namespacing

## Overview

We want to overhaul the way we handle files and folders, but particularly how we fetch them. Currently, filepaths are passed in the request body or query string, and they only include the path relative to the workspace root. The issue with passing the path through the request body is that it this approach does not work for GET requests, and the issue with passing the path through the query string is that it is not intuitive and it requires passing a separate workspace ID in the query string. Now, we want to add the workspace root name (a path-safe string) to the path for fetching and working with files and folders. We will still keep the request body approach but we'll get rid of the query string approach.

Path with workspace rootname namespacing
`/:workspaceRootname/:path`

## TODOs

- [ ] Add the workspace root name to the path when the file or folder's path is copied on the frontend.
- [ ] Update sdk doc for file and folder paths to include the workspace root name.
