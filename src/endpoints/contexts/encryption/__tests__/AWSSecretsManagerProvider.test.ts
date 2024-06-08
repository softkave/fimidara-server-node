import {faker} from '@faker-js/faker';
import assert from 'assert';
import {expectErrorThrown} from '../../../testUtils/helpers/error.js';
import {completeTests} from '../../../testUtils/helpers/testFns.js';
import {initTests} from '../../../testUtils/testUtils.js';
import {kUtilsInjectables} from '../../injection/injectables.js';
import {AWSSecretsManagerProvider} from '../AWSSecretsManagerProvider.js';
import {SecretsManagerProvider} from '../types.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';

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
  const conf = kUtilsInjectables.suppliedConfig();
  assert(conf.test);
  assert(conf.test.awsConfig);
  assert(conf.test.bucket);
  return {awsConfig: conf.test.awsConfig, bucket: conf.test.bucket};
}

function getSecretsManagerInstance() {
  const {awsConfig} = getTestAWSConfig();
  return new AWSSecretsManagerProvider(awsConfig);
}
