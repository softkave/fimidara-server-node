import assert from 'assert';
import {kUtilsInjectables} from '../contexts/injection/injectables.js';
import {
  MoveFromS3Config,
  moveFromS3ToFS,
} from '../tools/move-from-s3/moveFromS3ToFS.js';

export default async function SCRIPT_moveFromS3ToLocalFS() {
  if (process.env.NODE_ENV !== 'production') {
    kUtilsInjectables.logger().log('Skipping move from S3 to local FS');
    return;
  }

  const config = kUtilsInjectables.suppliedConfig();
  const awsConfig = config.awsConfigs?.all;

  assert(awsConfig, 'awsConfig is required');
  assert(config.localFsDir, 'localFsDir is required');
  assert(config.awsConfigs?.s3Bucket, 's3Bucket is required');

  const {region, accessKeyId, secretAccessKey} = awsConfig;
  assert(region, 'region is required');
  assert(accessKeyId, 'accessKeyId is required');
  assert(secretAccessKey, 'secretAccessKey is required');

  const options: MoveFromS3Config = {
    bucketName: config.awsConfigs.s3Bucket,
    destinationPath: config.localFsDir,
    awsConfig: {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    },
    concurrency: 10,
  };

  const stats = await moveFromS3ToFS(options);

  kUtilsInjectables.logger().log('Move from S3 completed!');
  kUtilsInjectables.logger().log('Stats:', {
    totalFiles: stats.totalFiles,
    filesProcessed: stats.filesProcessed,
    skippedFiles: stats.skippedFiles,
    errors: stats.errors.length,
  });

  if (stats.errors.length > 0) {
    kUtilsInjectables.logger().log('\nErrors encountered:');
    stats.errors.forEach(({key, error}) => {
      kUtilsInjectables.logger().error(`- File: ${key}`);
      kUtilsInjectables.logger().error(`  Error: ${error.message}`);
    });
  }
}
