import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import * as aws from 'aws-sdk';
import {IFilesNodeJestVars} from './types';

async function waitOnPromises(promises: Promise<any>[]) {
  (await Promise.allSettled(promises)).forEach(
    result => result.status === 'rejected' && console.error(result.reason)
  );
}

async function dropMongoCollections(globals: IFilesNodeJestVars) {
  const mongoURI = globals.mongoDbURI;
  const dbName = globals.mongoDbDatabaseName;
  const useMongoDataProvider = globals.dataProviderType === 'mongo';

  if (!mongoURI || !useMongoDataProvider) {
    return;
  }

  const connection = await mongoose
    .createConnection(mongoURI, {dbName})
    .asPromise();

  if (globals.isUsingAddedMongoDatabase) {
    console.log(`-- Mongo - dropping mongo db ${dbName} --`);
    await connection.dropDatabase();
  } else {
    console.log(`-- Mongo - dropping mongo collections in db ${dbName} --`);
    const collections = connection.collections;
    const promises = _.map(collections, collection => {
      return collection.drop();
    });

    await waitOnPromises(promises);
  }
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
  const credentials = new aws.Credentials({accessKeyId, secretAccessKey});
  aws.config.update({credentials, region});
  const s3 = new aws.S3();
  let continuationToken: string | undefined;

  do {
    const response: aws.S3.Types.ListObjectsV2Output = await s3
      .listObjectsV2({Bucket: bucketName, ContinuationToken: continuationToken})
      .promise();

    continuationToken = response.ContinuationToken;
    const contents = response.Contents;

    if (contents) {
      const keys: aws.S3.Types.ObjectIdentifierList = [];
      contents.forEach(item => item.Key && keys.push({Key: item.Key}));
      await waitOnPromises([
        s3
          .deleteObjects({
            Bucket: bucketName,
            Delete: {Objects: keys},
          })
          .promise(),
      ]);
    }
  } while (continuationToken);

  if (globals.isUsingAddedS3Bucket) {
    console.log(`-- AWS - deleting bucket ${bucketName} --`);
    await s3
      .deleteBucket({
        Bucket: bucketName,
      })
      .promise();
  }
}

async function jestGlobalTeardown(globals: IFilesNodeJestVars) {
  await waitOnPromises([
    dropMongoCollections(globals),
    deleteAWSBucketObjects(globals),
  ]);
}

module.exports = jestGlobalTeardown;
