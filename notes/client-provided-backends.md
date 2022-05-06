# Client provided backends

## Problem

Many companies already have a file storage system that they use to store files, and moving files to our system may be a pain. So, we need to make sure that we can move files to our system without breaking the existing system. Or sit on top their system and act as a proxy for access control. Also, I'm thinking of making the platform open source, so that companies can self-host and let it sit on top of their existing system, or host with us and act as a proxy for access control.

## Possible Solution

To make this work, we need to decouple our file storage and access layer. Files could be hosted with us in which case no much change is needed, or it could be hosted with a third party, in which case we need to add a way to securely access the files. Also, the server could be self-hosted. The database system will remain the same, which is where resources will be stored. The file storage system though will need to change. Starting with AWS S3, files hosted with the server will need access credentials for access and a bucket where files will be stored.
