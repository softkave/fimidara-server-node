import {fimidaraConfig} from '@/resources/vars';
import {testLogger} from '@/utils/logger/loggerUtils';
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  ObjectIdentifier,
  S3Client,
} from '@aws-sdk/client-s3';
import mongoose from 'mongoose';
import {globalDispose} from '../endpoints/globalUtils';
import {dropMongoConnection} from '../endpoints/testUtils/helpers/mongo';
import {FileBackendType, FimidaraConfig} from '../resources/types';
import _ = require('lodash');

async function waitOnPromises(promises: Promise<any>[]) {
  (await Promise.allSettled(promises)).forEach(
    result => result.status === 'rejected' && testLogger.error(result.reason)
  );
}

async function dropMongoCollections(globals: FimidaraConfig) {
  const mongoURI = globals.mongoDbURI;
  const appDbName = globals.mongoDbDatabaseName;
  if (!mongoURI) {
    return;
  }

  async function dropFn(name?: string) {
    if (!name) {
      return;
    }

    testLogger.info(`Dropping db - ${name}`);
    const connection = await mongoose.createConnection(mongoURI, {dbName: name}).asPromise();
    await dropMongoConnection(connection);
  }

  await waitOnPromises([dropFn(appDbName)]);
}

async function deleteAWSBucketObjects(globals: FimidaraConfig) {
  const accessKeyId = globals.awsAccessKeyId;
  const secretAccessKey = globals.awsSecretAccessKey;
  const region = globals.awsRegion;
  const bucketName = globals.S3Bucket;
  const useS3FileProvider = globals.fileBackend === FileBackendType.S3;
  if (!accessKeyId ?? !secretAccessKey ?? !region ?? !bucketName ?? !useS3FileProvider) {
    return;
  }

  testLogger.info(`-- AWS - deleting bucket ${bucketName} objects --`);
  const s3 = new S3Client({region: globals.awsRegion});
  let continuationToken: string | undefined;
  do {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      ContinuationToken: continuationToken,
    });

    const response = await s3.send(command);
    continuationToken = response.ContinuationToken;
    const contents = response.Contents;
    if (contents) {
      const keys: ObjectIdentifier[] = [];
      contents.forEach(item => item.Key && keys.push({Key: item.Key}));
      const command = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {Objects: keys},
      });

      await waitOnPromises([s3.send(command)]);
    }
  } while (continuationToken);

  s3.destroy();
}

async function jestGlobalTeardown() {
  const dropMongoPromise = dropMongoCollections(fimidaraConfig);
  await waitOnPromises([dropMongoPromise]);
  await testLogger.close();
  globalDispose();
}

module.exports = jestGlobalTeardown;
