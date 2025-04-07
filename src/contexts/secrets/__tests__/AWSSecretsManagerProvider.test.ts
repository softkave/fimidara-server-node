import {faker} from '@faker-js/faker';
import assert from 'assert';
import {merge} from 'lodash-es';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {expectErrorThrown} from '../../../endpoints/testHelpers/helpers/error.js';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {kIjxUtils} from '../../ijx/injectables.js';
import {AWSSecretsManagerProvider} from '../AWSSecretsManagerProvider.js';
import {SecretsManagerProvider} from '../types.js';

const secretIds: string[] = [];
let manager: SecretsManagerProvider | undefined;

beforeAll(async () => {
  await initTests();
  manager = await getSecretsManagerInstance();
});

afterAll(async () => {
  await completeTests();
  await Promise.all(
    secretIds.map(async secretId => {
      assert(manager);
      await manager.deleteSecret({secretId});
    })
  );
});

describe.skip('AWSSecretsManagerProvider', () => {
  test('addSecret', async () => {
    assert(manager);
    const name = faker.lorem.word();
    const secret = Math.random().toString();

    const result = await manager.addSecret({name, text: secret});
    secretIds.push(result.secretId);

    const {text} = await manager.getSecret({secretId: result.secretId});
    expect(result.secretId).toBeTruthy();
    expect(text).toBe(secret);
  });

  test('updateSecret', async () => {
    assert(manager);
    const name = faker.lorem.word();
    const secret = Math.random().toString();
    const {secretId} = await manager.addSecret({name, text: secret});
    secretIds.push(secretId);

    const result = await manager.updateSecret({secretId, name, text: secret});

    const {text} = await manager.getSecret({secretId: result.secretId});
    expect(result.secretId).toBeTruthy();
    expect(text).toBe(secret);
  });

  test('deleteSecret', async () => {
    assert(manager);
    const name = faker.lorem.word();
    const secret = Math.random().toString();
    const {secretId} = await manager.addSecret({name, text: secret});
    secretIds.push(secretId);

    await manager.deleteSecret({secretId});

    await expectErrorThrown(async () => {
      assert(manager);
      await manager.getSecret({secretId});
    });
  });

  test('getSecret', async () => {
    assert(manager);
    const name = faker.lorem.word();
    const secret = Math.random().toString();
    const {secretId} = await manager.addSecret({name, text: secret});
    secretIds.push(secretId);

    const {text} = await manager.getSecret({secretId});

    expect(text).toBe(secret);
  });
});

function getTestAWSConfig() {
  const conf = kIjxUtils.suppliedConfig();
  const awsCreds = merge(
    {},
    conf.awsConfigs?.all,
    conf.awsConfigs?.secretsManager
  );
  const s3Bucket = conf.awsConfigs?.s3Bucket;

  assert(awsCreds?.accessKeyId);
  assert(awsCreds?.region);
  assert(awsCreds?.secretAccessKey);
  assert(s3Bucket);

  return {awsCreds, bucket: s3Bucket};
}

function getSecretsManagerInstance() {
  const {awsCreds} = getTestAWSConfig();
  return new AWSSecretsManagerProvider(awsCreds);
}
