# Designs from Nov 24, 23

## How we save files

- Determing file size from actual bytes read instead of http content length
- Persisting files, for local
  - Error if file is being written to, otherwise, mark file as being written to using a txn
  - Create (if does not exist), and write to <filename>-vN (where N is current version)
  - Once stream is ended, in one txn, mark file as open to write. If stream was successful, increment file version, and set head to latest version
  - If stream is successful, and file versioning is on, keep previous version if we have one, if off, delete previous file
- Persisting files for all backends should fail if file is currently being written to
- Mounting backends
  - How do we structure filepath, or how do we know what file is where?
    - First answer, add backend to filepath, after workspace rootname, e.g `rootname/fimidara/folder/file.txt` or `rootname/aws/folder/file.txt`
    - Backends will have a short-code, fimidara for Fimidara, aws for AWS, gcloud for Google cloud, azure for Azure, etc.
    - What of differing file storage solutions within a backend, like S3 or EBS?
    - Use product name instead, seeing most likely product names will not overlap, and we can add a small ID for those that do, though it's unlikely. Another alternative is backend + product name, e.g `aws-s3`. We'll go with backend + product name, for intuitiveness. Fimidara will just be `fimidara`.
  - How do we deal with buckets?
    - First answer, bucket name should be part of filepath, e.g `rootname/aws-s3/bucket/folder/file.txt`
    - Should we support mounting under a different name or path? Advantage is a bit of security, and allows users to remount to something else in the future, like migrating from one cloud provider to the other, or to fimidara. We'll support mounting under a different name of folderpath.
    - How do we display this, and what should file structure look like?
      - Mount an entire backend product like s3 to a folderpath, e.g `aws-s3` -> `backend/another-name`, so filepath will look like `rootname/backend/another-name/bucket/filename.txt`
      - Mount a product + bucket to a folderpath, e.g `aws-s3/bucket-name` -> `backend/some-name`
      - Mount a product + multiple buckets to a folderpath with precedence, e.g `aws-s3/bucket-01`, `aws-s3/bucket-02` -> `backend/some-other-name`, with files getting resolved in `bucket-01`, and if not found, then in `bucket-02`
      - Mount a product + bucket + folderpath (for products that support folderpaths in buckets) to a folderpath
      - Basically, mount a product (or multiple products) + bucket (or multiple buckets) + folderpath (or multiple folderpaths) with precedence
      - Issue with this kind of mounting is, before-hand file ingestion, we cannot ingest conflicting files paths + extension
        - Or on ingestion, we keep a record saying other filepaths exist, and where. This information can get stale, so we timestamp it, and re-resolve when file is interacted with (or when file is interacted with, and an entry is no longer valid). We should also re-resove on un-mounting a backend
      - Concerning display, we can add a tag describing where a folderpath was mounted, and a sidebar describing it in detail
      - How do we store this?
        - If we store the mounted location in a config somewhere, how will we display in UI, and there can be a folder under which is mounted, several backends or buckets
        - Best option is in a config, and in present folder structure
        - In config for easy mounting and unmounting, for a quick view if what's mounted where
        - In folder for interaction, and displaying in the UI
        - Should we allow deleting the mount folder?
          - No, users should unmount from config instead.
        - How do we handle unmounting?
          - On unmounting, if all backends are unmounted, delete folder and children, without deleting where it's persisted, so only scrubing our side of things
          - Issue is we can mount different backends to a folerpath
  - If we add backend to filepath, how do we not give it away?
    - By allowing users mount to a folderpath
  - Should we ingest before-hand or ingest on read or write?
    - Allow for both, but let them know fuzzy and deep search won't be available/reliable in on-interaction ingestion
    - Also, always-ingest should poll for new changes for ingestion
    - Provide a API for users to instrument ingestion
  - What backend products do we want to support? To start
    - From AWS, s3, EBS
    - For GCP, cloud storage, filestore
    - For Azure, disk storage, blob storage, and files
    - Fimidara, local fs
  - What happens if a bucket or file was deleted in backend?
    - We do continuous polling if user opted for always-ingest
    - If a file is not found in backend, soft-delete, and error
  - How do we handle errors?
  - How do we handle unmounting a backend
    - Answered above
  - Should we create folders for backends mounted as is
    - Yes, for easier and straight forward code
  - For now, lock down mount paths, cannot delete, cannot rename, cannot move, cannot copy. In the future we'll look into these operations and what they should look like. For now, let's land it first. One thing at a time.
  - For now, should we limit ingestion to on-interaction? So, fetch files and folders on interacting with them.
    - Possible downside is deep fuzzy search which we'll implement later
    - We'll allow both always-ingest and on-interaction-ingest
  - Should we create buckets or not?
  - Mount root (workspace rootname) to fimidara, and resolving folder mounts should walk up the directory
    - Walking up the directory tree means index cannot be stored on mount, seeing it can be different for each folder in the directory tree OR should it be auto, meaning parent folder mounts will always weigh less than folder declared mounts. Auto seems the best option.

## File mounting TODOs

- We need config including credentials for each backend
- We need to store what is mounted, and where
- We need to encrypt credentials
- We need to store in folders where to resolve interactions
- We need to write endpoints for ingestion, and store ingestion progress
- We need to write code to ingest on interaction
- We need new permission for who can mount and unmount backends, also who can change backend credentials

## Iteration TODOs

- fan to one mount / fan to many mounts
- backend fimidara & aws s3
- folder
- backends like s3 won't return folder, just files on describe
- key is filepath