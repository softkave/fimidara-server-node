#!/usr/bin/env node

import {Command} from 'commander';
import {moveFromS3ToFS} from './moveFromS3ToFS.js';

const program = new Command();

program
  .name('move-from-s3')
  .description('Move files from an S3 bucket to the local filesystem')
  .requiredOption('-b, --bucket-name <name>', 'S3 bucket name')
  .requiredOption('-d, --destination-path <path>', 'Local destination path')
  .requiredOption('-r, --region <region>', 'AWS region')
  .requiredOption('-k, --access-key-id <key>', 'AWS access key ID')
  .requiredOption('-s, --secret-access-key <secret>', 'AWS secret access key')
  .option('-c, --concurrency <number>', 'Number of concurrent downloads', '5')
  .action(async options => {
    try {
      const stats = await moveFromS3ToFS({
        bucketName: options.bucketName,
        destinationPath: options.destinationPath,
        awsConfig: {
          region: options.region,
          credentials: {
            accessKeyId: options.accessKey,
            secretAccessKey: options.secretAccessKey,
          },
        },
        concurrency: parseInt(options.concurrency),
      });

      console.log('Move from S3 completed!');
      console.log('Stats:', {
        totalFiles: stats.totalFiles,
        filesProcessed: stats.filesProcessed,
        skippedFiles: stats.skippedFiles,
        errors: stats.errors.length,
      });

      if (stats.errors.length > 0) {
        console.log('\nErrors encountered:');
        stats.errors.forEach(({key, error}) => {
          console.error(`- File: ${key}`);
          console.error(`  Error: ${error.message}`);
        });
      }
    } catch (error) {
      console.error('Failed to complete move from S3:', error);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  });

program.parse(process.argv);
