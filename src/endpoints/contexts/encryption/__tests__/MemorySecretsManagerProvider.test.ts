import {faker} from '@faker-js/faker';
import {expectErrorThrown} from '../../../testUtils/helpers/error.js';
import {completeTests} from '../../../testUtils/helpers/testFns.js';
import {initTests} from '../../../testUtils/testUtils.js';
import {MemorySecretsManagerProvider} from '../MemorySecretsManagerProvider.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('MemorySecretsManagerProvider', () => {
  test('addSecret', async () => {
    const name = faker.lorem.word();
    const secret = Math.random().toString();

    const manager = new MemorySecretsManagerProvider();
    const result = await manager.addSecret({name, text: secret});

    const {text} = await manager.getSecret({secretId: result.secretId});
    expect(result.secretId).toBeTruthy();
    expect(text).toBe(secret);
  });

  test('updateSecret', async () => {
    const name = faker.lorem.word();
    const secret = Math.random().toString();
    const manager = new MemorySecretsManagerProvider();
    const {secretId} = await manager.addSecret({name, text: secret});

    const result = await manager.updateSecret({secretId, name, text: secret});

    const {text} = await manager.getSecret({secretId: result.secretId});
    expect(result.secretId).toBeTruthy();
    expect(text).toBe(secret);
  });

  test('deleteSecret', async () => {
    const name = faker.lorem.word();
    const secret = Math.random().toString();
    const manager = new MemorySecretsManagerProvider();
    const {secretId} = await manager.addSecret({name, text: secret});

    await manager.deleteSecret({secretId});

    await expectErrorThrown(async () => {
      await manager.getSecret({secretId});
    });
  });

  test('getSecret', async () => {
    const name = faker.lorem.word();
    const secret = Math.random().toString();
    const manager = new MemorySecretsManagerProvider();
    const {secretId} = await manager.addSecret({name, text: secret});

    const {text} = await manager.getSecret({secretId});

    expect(text).toBe(secret);
  });
});
