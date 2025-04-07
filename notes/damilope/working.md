# damilope's working notes

## Working On

## TODOs

- remove page auth required from files and folders to allow public access to files and folders
- select workspace from sidebar
- better labeled node design
- redesign main page
- don't count reused parts towards upload rate
- provide a custom react upload component
- provide a custom upload and download progress listener
- figure out how to resume download from browser
- figure out thumbnail generation for download links
- make it easier to make a file/resource public
- a get download url from file
- simple file share
- newly uploaded files do not show in the file list until refresh
- upload new file through update fails
- add web header to error page
- some docs are not working
- fimidara sync is not working/slow
- surface a percentage of completion for fimidara sync & upload api
- a timestamp to logs
- make sure presigned paths with single use last the duration of the upload multipart
- encountered a resource is locked by another consumer error though I was the only consumer
- cleanup parts after TTL
- cleanup transfer progress after upload is retried
- counter in transfer progress is not working
- don't show time remaining for upload if it's done
- a quick way to see if a file/folder is public and to make it public
- add change log
- config generation
- heartbeat from runner
- cache locally from other servers
- cache locally from s3 and write post using your own story
- write script to change entry
- a possibility is a last upload is requested on a server and other parts on other servers are not done
- save metas
- validate parts in complete multipart upload
- discrepancy between inter-server auth header names
- a different design for namepath to allow changing the namepath of a file
- whitelist local for http, everything else is https
- there is an infinite loop when logging in
- move email to Resend
- heartbeat issue
- move to Next 15
- start, upload, and complete multipart uploads
- only one file shows after upload 2 files
- delete file not removing file
- usage thresholds completion

## Implementation notes
