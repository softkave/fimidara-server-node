import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import {
  ObjectIdentifier,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import {IFilesNodeJestVars} from './types';
import {
  ExtractEnvSchema,
  extractProdEnvsSchema,
} from '../src/resources/appVariables';
import {
  getTestVarsInternalFn,
  ITestVariables,
} from '../src/endpoints/test-utils/vars';

async function waitOnPromises(promises: Promise<any>[]) {
  (await Promise.allSettled(promises)).forEach(
    result => result.status === 'rejected' && console.error(result.reason)
  );
}

async function dropMongoCollections(globals: ITestVariables) {
  const mongoURI = globals.mongoDbURI;
  const dbName = globals.mongoDbDatabaseName;
  const useMongoDataProvider = globals.dataProviderType === 'mongo';

  console.log({globals, useMongoDataProvider});

  if (!mongoURI || !useMongoDataProvider) {
    return;
  }

  const connection = await mongoose
    .createConnection(mongoURI, {dbName})
    .asPromise();

  console.log(`-- Mongo - dropping mongo collections in db ${dbName} --`);
  const collections = await connection.db.collections();
  const promises = _.map(collections, collection => {
    return collection.drop();
  });

  await waitOnPromises(promises);
  await connection.close();
}

async function deleteAWSBucketObjects(globals: IFilesNodeJestVars) {
  const accessKeyId = globals.awsAccessKeyId;
  const secretAccessKey = globals.awsSecretAccessKey;
  const region = globals.awsRegion;
  const bucketName = globals.S3Bucket;
  const useS3FileProvider = globals.useS3FileProvider;

  if (
    !accessKeyId ||
    !secretAccessKey ||
    !region ||
    !bucketName ||
    !useS3FileProvider
  ) {
    return;
  }

  console.log(`-- AWS - deleting bucket ${bucketName} objects --`);
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

  const vars = getTestVarsInternalFn(envSchema);
  await waitOnPromises([
    dropMongoCollections(vars),
    deleteAWSBucketObjects(vars),
  ]);
}

module.exports = jestGlobalTeardown;
