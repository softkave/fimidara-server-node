import {format} from 'date-fns';
import {
  AppEnvVariables,
  FileBackendType,
  IAppVariables,
} from '../resources/vars';

export function addTestAWSBucket(vars: IAppVariables, testType = 'test') {
  let bucketName = vars.S3Bucket;
  const useS3FileProvider = vars.fileBackend === FileBackendType.S3;
  if (useS3FileProvider && !bucketName) {
    const formattedDate = format(new Date(), 'MMM-d-YYY');
    bucketName = `fimidara-node-${testType}-${formattedDate}`;
    vars.S3Bucket = bucketName;
    process.env[AppEnvVariables.S3_BUCKET] = bucketName;
  }
}