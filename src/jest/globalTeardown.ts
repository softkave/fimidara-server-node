import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  ObjectIdentifier,
  S3Client,
} from '@aws-sdk/client-s3';
import mongoose from 'mongoose';
import {disposeApplicationGlobalUtilities} from '../endpoints/globalUtils';
import {dropMongoConnection} from '../endpoints/testUtils/helpers/mongo';
import {AppEnvSchema, AppVariables, FileBackendType} from '../resources/types';
import {getAppVariables, prodEnvsSchema} from '../resources/vars';
import {AnyObject} from '../utils/types';
import {jestLogger} from './logger';
import _ = require('lodash');

async function waitOnPromises(promises: Promise<any>[]) {
  (await Promise.allSettled(promises)).forEach(
    result => result.status === 'rejected' && jestLogger.error(result.reason)
  );
}

async function dropMongoCollections(globals: AppVariables) {
  const mongoURI = globals.mongoDbURI;
  const appDbName = globals.mongoDbDatabaseName;
  const logsDbName = globals.logsDbName;
  if (!mongoURI) {
    return;
  }

  async function dropFn(name?: string) {
    if (!name) {
      return;
    }

    jestLogger.info(`Dropping db - ${name}`);
    const connection = await mongoose.createConnection(mongoURI, {dbName: name}).asPromise();
    await dropMongoConnection(connection);
  }

  await waitOnPromises([dropFn(appDbName), dropFn(logsDbName)]);
}

async function deleteAWSBucketObjects(globals: AppVariables) {
  const accessKeyId = globals.awsAccessKeyId;
  const secretAccessKey = globals.awsSecretAccessKey;
  const region = globals.awsRegion;
  const bucketName = globals.S3Bucket;
  const useS3FileProvider = globals.fileBackend === FileBackendType.S3;
  if (!accessKeyId ?? !secretAccessKey ?? !region ?? !bucketName ?? !useS3FileProvider) {
    return;
  }

  jestLogger.info(`-- AWS - deleting bucket ${bucketName} objects --`);
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
  const envSchema = Object.keys(prodEnvsSchema).reduce((map, key) => {
    const k = key as keyof AppEnvSchema;
    map[k] = {...prodEnvsSchema[k], required: false};
    return map;
  }, {} as AnyObject) as AppEnvSchema;

  const vars = getAppVariables(envSchema);
  const dropMongoPromise = dropMongoCollections(vars);
  await waitOnPromises([dropMongoPromise]);
  await jestLogger.close();
  disposeApplicationGlobalUtilities();
}

module.exports = jestGlobalTeardown;
