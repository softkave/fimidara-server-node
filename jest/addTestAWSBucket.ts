import {format} from 'date-fns';
import {AppEnvVariables} from '../src/resources/appVariables';
import {IFilesNodeJestVars} from './types';

export function addTestAWSBucket(vars: IFilesNodeJestVars, testType = 'test') {
  let bucketName = vars.S3Bucket;
  const useS3FileProvider = vars.useS3FileProvider;

  if (useS3FileProvider && !bucketName) {
    const formattedDate = format(new Date(), 'MMM-d-YYY');
    bucketName = `files-node-${testType}-${formattedDate}`;
    vars.S3Bucket = bucketName;
    process.env[AppEnvVariables.S3_BUCKET] = bucketName;
    vars.isUsingAddedS3Bucket = true;
  }
}
