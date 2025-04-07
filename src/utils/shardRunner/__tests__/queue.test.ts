import {TimeoutError, waitTimeout} from 'softkave-js-utils';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../endpoints/testHelpers/utils.js';
import {queueShardRunner} from '../queue.js';
import {
  IShardRunnerEntry,
  IShardRunnerMessage,
  IShardRunnerOutput,
  kShardRunnerOutputType,
} from '../types.js';
import {getShardRunnerPubSubAlertChannel} from '../utils.js';

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

interface ITestItem {
  data: string;
}

describe('shardRunner queue', () => {
  test('queued + success', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const item: ITestItem = {data: 'test'};
    const queueKey = 'test' + Math.random();
    const wakeupChannel = getShardRunnerPubSubAlertChannel({queueKey});

    kIjxUtils.pubsub().subscribe(wakeupChannel, async () => {
      const messages = await kIjxUtils
        .queue()
        .getMessages(queueKey, /** count */ 1);
      expect(messages).toHaveLength(1);

      const [message] = messages;
      const entry = JSON.parse(
        (message.message as IShardRunnerMessage).msg
      ) as IShardRunnerEntry<ITestItem>;
      expect(entry.item).toMatchObject(item);

      const output: IShardRunnerOutput<ITestItem> = {
        id: entry.id,
        type: kShardRunnerOutputType.success,
        item,
      };
      await kIjxUtils.pubsub().publish(entry.outputChannel, output);
    });

    const p = queueShardRunner({
      item,
      queueKey,
      agent: sessionAgent,
      timeoutMs: 1000,
    });

    const output = await p;
    expect(output).toEqual(item);
  });

  test('queued + error', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const item: ITestItem = {data: 'test'};
    const queueKey = 'test' + Math.random();
    const wakeupChannel = getShardRunnerPubSubAlertChannel({queueKey});

    kIjxUtils.pubsub().subscribe(wakeupChannel, async () => {
      const messages = await kIjxUtils
        .queue()
        .getMessages(queueKey, /** count */ 1);
      expect(messages).toHaveLength(1);

      const [message] = messages;
      const entry = JSON.parse(
        (message.message as IShardRunnerMessage).msg
      ) as IShardRunnerEntry<ITestItem>;
      expect(entry.item).toMatchObject(item);

      const output: IShardRunnerOutput<ITestItem> = {
        id: entry.id,
        type: kShardRunnerOutputType.error,
        error: new Error('test'),
      };
      await kIjxUtils.pubsub().publish(entry.outputChannel, output);
    });

    await expect(async () => {
      await queueShardRunner({
        item,
        queueKey,
        agent: sessionAgent,
        timeoutMs: 1000,
      });
    }).rejects.toThrowError('test');
  });

  test('queued + timeout', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const item: ITestItem = {data: 'test'};
    const queueKey = 'test' + Math.random();

    await expect(() =>
      queueShardRunner({
        item,
        queueKey,
        agent: sessionAgent,
        timeoutMs: 100,
      })
    ).rejects.toThrow(TimeoutError);
  });

  test('queued + ack', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const item: ITestItem = {data: 'test'};
    const queueKey = 'test' + Math.random();
    const wakeupChannel = getShardRunnerPubSubAlertChannel({queueKey});
    let startMs = 0;

    kIjxUtils.pubsub().subscribe(wakeupChannel, async () => {
      const messages = await kIjxUtils
        .queue()
        .getMessages(queueKey, /** count */ 1);
      expect(messages).toHaveLength(1);

      const [message] = messages;
      const entry = JSON.parse(
        (message.message as IShardRunnerMessage).msg
      ) as IShardRunnerEntry<ITestItem>;
      expect(entry.item).toMatchObject(item);

      const ackOutput: IShardRunnerOutput<ITestItem> = {
        id: entry.id,
        type: kShardRunnerOutputType.ack,
      };
      await kIjxUtils.pubsub().publish(entry.outputChannel, ackOutput);
      await waitTimeout(Math.max(0, Date.now() - (startMs + 1_100)));

      const output: IShardRunnerOutput<ITestItem> = {
        id: entry.id,
        type: kShardRunnerOutputType.success,
        item,
      };
      await kIjxUtils.pubsub().publish(entry.outputChannel, output);
    });

    const p = queueShardRunner({
      item,
      queueKey,
      agent: sessionAgent,
      timeoutMs: 1000,
    });
    startMs = Date.now();

    const output = await p;
    expect(output).toEqual(item);
  });
});
