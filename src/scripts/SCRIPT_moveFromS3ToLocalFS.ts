import {getLocalFsDirFromSuppliedConfig} from '../contexts/file/LocalFsFilePersistenceProvider.js';
import {getAWSS3ConfigFromSuppliedConfig} from '../contexts/file/S3FilePersistenceProvider.js';
import {kIkxUtils} from '../contexts/ijx/injectables.js';
import {
  MoveFromS3Config,
  moveFromS3ToFS,
} from '../tools/move-from-s3/moveFromS3ToFS.js';

export default async function SCRIPT_moveFromS3ToLocalFS() {
  if (process.env.NODE_ENV !== 'production') {
    kIkxUtils.logger().log('Skipping move from S3 to local FS');
    return;
  }

  const config = kIkxUtils.suppliedConfig();
  const s3Config = getAWSS3ConfigFromSuppliedConfig(config);
  const {localFsDir} = getLocalFsDirFromSuppliedConfig();

  const options: MoveFromS3Config = {
    bucketName: s3Config.bucket,
    destinationPath: localFsDir,
    awsConfig: {
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    },
    concurrency: 10,
  };

  const stats = await moveFromS3ToFS(options);

  kIkxUtils.logger().log('Move from S3 completed!');
  kIkxUtils.logger().log('Stats:', {
    totalFiles: stats.totalFiles,
    filesProcessed: stats.filesProcessed,
    skippedFiles: stats.skippedFiles,
    errors: stats.errors.length,
  });

  if (stats.errors.length > 0) {
    kIkxUtils.logger().log('\nErrors encountered:');
    stats.errors.forEach(({key, error}) => {
      kIkxUtils.logger().error(`- File: ${key}`);
      kIkxUtils.logger().error(`  Error: ${error.message}`);
    });
  }
}
