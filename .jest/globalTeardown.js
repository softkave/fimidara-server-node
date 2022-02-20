const mongoose = require('mongoose');
const _ = require('lodash');
const aws = require('aws-sdk');

async function waitOnPromises(promises) {
  (await Promise.allSettled(promises)).forEach(
    result => result.reason && console.error(result.reason)
  );
}

async function dropMongoCollections() {
  const mongoURI = process.env.MONGO_URI;
  const useMongoDataProvider = process.env.DATA_PROVIDER_TYPE === 'mongo';

  if (!mongoURI || !useMongoDataProvider) {
    return;
  }

  console.log('-- Mongo - dropping mongo collections --');
  const connection = await mongoose.createConnection(mongoURI).asPromise();
  const collections = connection.collections;
  const promises = _.map(collections, collection => {
    collection.drop();
  });

  await waitOnPromises(promises);
}

async function deleteAWSBucketObjects() {
  const accessKeyId = process.env.ACCESS_KEY_ID;
  const secretAccessKey = process.env.SECRET_ACCESS_KEY;
  const region = process.env.REGION;
  const bucketName = process.env.S3_BUCKET;
  const useS3FileProvider = process.env.USE_S3_FILE_PROVIDER;

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
  let continuationToken = null;

  do {
    const response = await s3
      .listObjectsV2({Bucket: bucketName, ContinuationToken: continuationToken})
      .promise();

    continuationToken = response.ContinuationToken;
    await waitOnPromises([
      s3
        .deleteObjects({
          Bucket: bucketName,
          Delete: {Objects: response.Contents},
        })
        .promise(),
    ]);
  } while (continuationToken);
}

async function jestGlobalTeardown() {
  await waitOnPromises([dropMongoCollections(), deleteAWSBucketObjects()]);
}

module.exports = jestGlobalTeardown;
