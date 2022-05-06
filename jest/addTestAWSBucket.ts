import {format} from 'date-fns';
import {ITestVariables} from '../src/endpoints/test-utils/vars';
import {AppEnvVariables} from '../src/resources/appVariables';

export function addTestAWSBucket(vars: ITestVariables, testType = 'test') {
  let bucketName = vars.S3Bucket;
  const useS3FileProvider = vars.useS3FileProvider;

  if (useS3FileProvider && !bucketName) {
    const formattedDate = format(new Date(), 'MMM-d-YYY');
    bucketName = `fimidara-node-${testType}-${formattedDate}`;
    vars.S3Bucket = bucketName;
    process.env[AppEnvVariables.S3_BUCKET] = bucketName;
  }
}
