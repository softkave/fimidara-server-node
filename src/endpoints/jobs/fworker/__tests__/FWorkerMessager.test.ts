import {faker} from '@faker-js/faker';
import assert from 'assert';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {MessageChannel} from 'worker_threads';
import {TimeoutError} from '../../../../utils/errors.js';
import {waitTimeout} from '../../../../utils/fns.js';
import {expectErrorThrown} from '../../../testHelpers/helpers/error.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../testHelpers/utils.js';
import {FWorkerMessager} from '../FWorkerMessager.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('FWorkerMessager', () => {
  test('postTrackedMessage, ack', async () => {
    const {port1, port2} = new MessageChannel();
    const fworkerMessager = new FWorkerMessager();
    const value = faker.number.int();
    port2.on('message', value => {
      port2.postMessage(value);
    });

    const response = await fworkerMessager.postTrackedMessage({
      value,
      outgoingPort: port1,
      incomingPort: port1,
      expectAck: true,
    });

    assert(FWorkerMessager.isWorkerTrackedMessage(response));
    expect(response.value).toBe(value);
  });

  test('postTrackedMessage, no ack', async () => {
    const {port1, port2} = new MessageChannel();
    const fworkerMessager = new FWorkerMessager();
    const value = faker.number.int();
    port2.on('message', value => port2.postMessage(value));

    const response = await fworkerMessager.postTrackedMessage({
      value,
      outgoingPort: port1,
      incomingPort: port1,
    });

    expect(response).toBe(undefined);
  });

  test('postTrackedMessage, ack timeout', async () => {
    const {port1, port2} = new MessageChannel();
    const fworkerMessager = new FWorkerMessager();
    const value = faker.number.int();
    const ackTimeoutMs = 20;
    port2.on('message', async value => {
      await waitTimeout(ackTimeoutMs * 3);
      port2.postMessage(value);
    });

    await expectErrorThrown(async () => {
      await fworkerMessager.postTrackedMessage({
        value,
        ackTimeoutMs,
        outgoingPort: port1,
        incomingPort: port1,
        expectAck: true,
      });
    }, [TimeoutError.name]);
  });
});
