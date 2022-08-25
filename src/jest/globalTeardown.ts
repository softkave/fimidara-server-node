import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  ObjectIdentifier,
  S3Client,
} from '@aws-sdk/client-s3';
import _ from 'lodash';
import mongoose from 'mongoose';
import {
  ExtractEnvSchema,
  extractEnvVariables,
  extractProdEnvsSchema,
  FileBackendType,
  IAppVariables,
} from '../resources/vars';
import {jestLogger} from './logger';

async function waitOnPromises(promises: Promise<any>[]) {
  (await Promise.allSettled(promises)).forEach(
    result => result.status === 'rejected' && jestLogger.error(result.reason)
  );
}

async function dropMongoCollections(globals: IAppVariables) {
  const mongoURI = globals.mongoDbURI;
  const dbName = globals.mongoDbDatabaseName;
  if (!mongoURI) {
    return;
  }

  const connection = await mongoose
    .createConnection(mongoURI, {dbName})
    .asPromise();

  jestLogger.info(`-- Mongo - dropping mongo collections in db ${dbName} --`);
  const collections = await connection.db.collections();
  const promises = _.map(collections, collection => {
    return collection.drop();
  });

  await waitOnPromises(promises);
  await connection.close();
}

async function deleteAWSBucketObjects(globals: IAppVariables) {
  const accessKeyId = globals.awsAccessKeyId;
  const secretAccessKey = globals.awsSecretAccessKey;
  const region = globals.awsRegion;
  const bucketName = globals.S3Bucket;
  const useS3FileProvider = globals.fileBackend === FileBackendType.S3;
  if (
    !accessKeyId ||
    !secretAccessKey ||
    !region ||
    !bucketName ||
    !useS3FileProvider
  ) {
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
  const envSchema = Object.keys(extractProdEnvsSchema).reduce((map, key) => {
    const k = key as keyof ExtractEnvSchema;
    map[k] = {...extractProdEnvsSchema[k], required: false};
    return map;
  }, {} as ExtractEnvSchema);

  const vars = extractEnvVariables(envSchema);
  const dropMongoPromise = dropMongoCollections(vars);
  const dropAWSBucketsPromise = deleteAWSBucketObjects(vars);
  await waitOnPromises([dropMongoPromise, dropAWSBucketsPromise]);
}

module.exports = jestGlobalTeardown;
