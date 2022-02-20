import assert = require('assert');
import * as aws from 'aws-sdk';

let awsConfigured = false;

export function configureAWS(
  accessKeyId: string,
  secretAccessKey: string,
  region: string
) {
  const credentials = new aws.Credentials({accessKeyId, secretAccessKey});
  aws.config.update({
    credentials,
    region,
  });

  awsConfigured = true;
}

export function assertAWSConfigured() {
  assert(awsConfigured, 'AWS not configured.');
}
