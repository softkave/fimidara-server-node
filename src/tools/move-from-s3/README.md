# Move from S3 to FS

Moves files from an S3 bucket to the local filesystem.

## Commands

Assuming you're running from the root of the server project:

```bash
npx tsx src/tools/move-from-s3/index.ts \
  --bucket-name my-bucket \
  --destination-path /path/to/destination \
  --region us-east-1 \
  --access-key-id AKIAXXXXXXXX \
  --secret-access-key XXXXXXXXXX \
  --concurrency 10
```
