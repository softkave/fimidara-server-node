import {getDeferredPromise, waitTimeout} from 'softkave-js-utils';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../endpoints/testHelpers/utils.js';
import {
  handleShardQueue,
  multiItemsHandleShardQueue,
  singleItemHandleShardQueue,
  startShardRunner,
  stopShardRunner,
} from '../handler.js';
import {
  IShardRunnerEntry,
  IShardRunnerMessage,
  IShardRunnerOutput,
  kShardRunnerOutputType,
  kShardRunnerPubSubAlertMessage,
  ShardRunnerProvidedHandlerResultMap,
  ShardRunnerProvidedMultiItemsHandler,
  ShardRunnerProvidedSingleItemHandler,
} from '../types.js';
import {
  getShardRunnerPubSubAlertChannel,
  getShardRunnerPubSubOutputChannel,
  isActiveShardRunner,
} from '../utils.js';

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

describe('shardRunner handler > startShardRunner', () => {
  test('wakeup', async () => {
    const queueKey = 'test' + Math.random();
    const handlerFn = vi.fn();
    startShardRunner({queueKey, handlerFn});

    await kIjxUtils
      .pubsub()
      .publish(
        getShardRunnerPubSubAlertChannel({queueKey}),
        kShardRunnerPubSubAlertMessage
      );

    await waitTimeout(100);
    expect(handlerFn).toHaveBeenCalled();
    expect(isActiveShardRunner({queueKey})).toBe(true);
  });

  test('wakeup when ended', async () => {
    kIjxUtils.runtimeState().setIsEnded(true);
    const queueKey = 'test' + Math.random();
    const handlerFn = vi.fn();
    startShardRunner({queueKey, handlerFn});

    await kIjxUtils
      .pubsub()
      .publish(
        getShardRunnerPubSubAlertChannel({queueKey}),
        kShardRunnerPubSubAlertMessage
      );

    await waitTimeout(100);
    expect(handlerFn).not.toHaveBeenCalled();
    expect(isActiveShardRunner({queueKey})).toBeFalsy();
  });

  test('wakeup when active', async () => {
    const queueKey = 'test' + Math.random();
    const handlerFn01 = vi.fn();
    startShardRunner({queueKey, handlerFn: handlerFn01});

    async function wakeup() {
      await kIjxUtils
        .pubsub()
        .publish(
          getShardRunnerPubSubAlertChannel({queueKey}),
          kShardRunnerPubSubAlertMessage
        );
    }

    await wakeup();
    await wakeup();

    await waitTimeout(100);
    expect(isActiveShardRunner({queueKey})).toBe(true);
    expect(handlerFn01).toHaveBeenCalledTimes(1);

    await wakeup();
    await wakeup();

    await waitTimeout(100);
    expect(handlerFn01).toHaveBeenCalledTimes(1);
    expect(isActiveShardRunner({queueKey})).toBe(true);
  });
});

describe('shardRunner handler > stopShardRunner', () => {
  test('stop', async () => {
    const queueKey = 'test' + Math.random();
    const handlerFn = vi.fn();
    startShardRunner({queueKey, handlerFn});

    async function wakeup() {
      await kIjxUtils
        .pubsub()
        .publish(
          getShardRunnerPubSubAlertChannel({queueKey}),
          kShardRunnerPubSubAlertMessage
        );
    }

    // wakeup and assert runner is active
    await wakeup();

    await waitTimeout(100);
    expect(handlerFn).toHaveBeenCalled();
    expect(isActiveShardRunner({queueKey})).toBe(true);

    // stop and assert runner is not active
    await stopShardRunner({queueKey});
    expect(isActiveShardRunner({queueKey})).toBeFalsy();

    // try wakeup and assert runner was not called
    await wakeup();

    await waitTimeout(100);
    expect(handlerFn).toHaveBeenCalledTimes(1);
    expect(isActiveShardRunner({queueKey})).toBeFalsy();
  });
});

interface ITestItem {
  id: string;
}

function pJSON(value: any) {
  // some test values are the same serialized but different in object format,
  // e.g. Mongo's _id is string serialized but in object is ObjectId so we need
  // to parse and stringify to compare
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

describe('shardRunner handler > handleShardQueue', () => {
  test('reads items and calls handlerFn', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const queueKey = 'test' + Math.random();
    const count = {ack: 0, success: 0, error: 0, expected: 4};
    const p = getDeferredPromise();
    const acks: IShardRunnerOutput<ITestItem>[] = [];
    const outputFn = vi
      .fn()
      .mockImplementation(async (output: IShardRunnerOutput<ITestItem>) => {
        if (output.type === kShardRunnerOutputType.ack) {
          count.ack++;
          acks.push(output);
        } else if (output.type === kShardRunnerOutputType.success) {
          count.success++;
        } else if (output.type === kShardRunnerOutputType.error) {
          count.error++;
        }

        if (count.ack === count.expected) {
          p.resolve();
        }
      });
    const handlerFn = vi.fn();

    async function queueItem(id: string) {
      const outputChannel = getShardRunnerPubSubOutputChannel({
        queueKey,
        id,
      });
      const item: IShardRunnerEntry<ITestItem> = {
        id,
        item: {id},
        outputChannel,
        agent: sessionAgent,
      };
      const message: IShardRunnerMessage = {
        msg: JSON.stringify(item),
      };

      await kIjxUtils.queue().addMessages(queueKey, [message]);
      await kIjxUtils.pubsub().subscribeJson(item.outputChannel, outputFn);

      return item;
    }

    const items01 = await Promise.all([queueItem('01'), queueItem('02')]);
    const items02 = await Promise.all([queueItem('03'), queueItem('04')]);

    await handleShardQueue({
      queueKey,
      handlerFn,
      readCount: 2,
    });

    await p.promise;

    const [call01, call02] = handlerFn.mock.calls;
    expect(pJSON(call01)).toEqual(pJSON([items01]));
    expect(pJSON(call02)).toEqual(pJSON([items02]));

    const itemsCombined = [...items01, ...items02];
    acks.sort((a, b) => a.id.localeCompare(b.id));
    expect(acks).toHaveLength(4);
    acks.forEach((ack, index) => {
      expect(ack).toMatchObject({
        id: itemsCombined[index].id,
        type: kShardRunnerOutputType.ack,
      });
    });
  });
});

describe('shardRunner handler > singleItemHandleShardQueue', () => {
  test('singleItemHandleShardQueue outputs', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const queueKey = 'test' + Math.random();
    const count = {ack: 0, success: 0, error: 0, expected: 4};
    const p = getDeferredPromise();
    const acks: IShardRunnerOutput<ITestItem>[] = [];
    const outputs: IShardRunnerOutput<ITestItem>[] = [];
    const outputFn = vi
      .fn()
      .mockImplementation(async (output: IShardRunnerOutput<ITestItem>) => {
        if (output.type === kShardRunnerOutputType.ack) {
          count.ack++;
          acks.push(output);
        } else if (output.type === kShardRunnerOutputType.success) {
          count.success++;
          outputs.push(output);
        } else if (output.type === kShardRunnerOutputType.error) {
          count.error++;
        }

        if (count.success === count.expected) {
          p.resolve();
        }
      });
    const __handlerFn: ShardRunnerProvidedSingleItemHandler<
      ITestItem
    > = async params => {
      return {
        type: kShardRunnerOutputType.success,
        item: params.item,
      };
    };
    const handlerFn = vi.fn().mockImplementation(__handlerFn);

    async function queueItem(id: string) {
      const outputChannel = getShardRunnerPubSubOutputChannel({
        queueKey,
        id,
      });
      const item: IShardRunnerEntry<ITestItem> = {
        id,
        item: {id},
        outputChannel,
        agent: sessionAgent,
      };
      const message: IShardRunnerMessage = {
        msg: JSON.stringify(item),
      };

      await kIjxUtils.queue().addMessages(queueKey, [message]);
      await kIjxUtils.pubsub().subscribeJson(item.outputChannel, outputFn);

      return item;
    }

    const items01 = await Promise.all([queueItem('01'), queueItem('02')]);
    const items02 = await Promise.all([queueItem('03'), queueItem('04')]);

    await singleItemHandleShardQueue({
      queueKey,
      readCount: 2,
      providedHandler: handlerFn,
    });

    await p.promise;

    const [call01, call02, call03, call04] = handlerFn.mock.calls;

    expect(pJSON(call01)).toEqual(pJSON([{item: items01[0]}]));
    expect(pJSON(call02)).toEqual(pJSON([{item: items01[1]}]));
    expect(pJSON(call03)).toEqual(pJSON([{item: items02[0]}]));
    expect(pJSON(call04)).toEqual(pJSON([{item: items02[1]}]));

    const itemsCombined = [...items01, ...items02];
    expect(acks).toHaveLength(4);
    acks.forEach((ack, index) => {
      expect(ack).toMatchObject({
        id: itemsCombined[index].id,
        type: kShardRunnerOutputType.ack,
      });
    });

    expect(outputs).toHaveLength(4);
    outputs.forEach((output, index) => {
      expect(output).toMatchObject({
        id: itemsCombined[index].id,
        type: kShardRunnerOutputType.success,
        item: itemsCombined[index].item,
      });
    });
  });

  test('singleItemHandleShardQueue error', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const queueKey = 'test' + Math.random();
    const count = {ack: 0, error: 0, success: 0, expected: 4};
    const p = getDeferredPromise();
    const acks: IShardRunnerOutput<ITestItem>[] = [];
    const outputs: IShardRunnerOutput<ITestItem>[] = [];
    const outputFn = vi
      .fn()
      .mockImplementation(async (output: IShardRunnerOutput<ITestItem>) => {
        if (output.type === kShardRunnerOutputType.ack) {
          count.ack++;
          acks.push(output);
        } else if (output.type === kShardRunnerOutputType.error) {
          count.error++;
          outputs.push(output);
        } else if (output.type === kShardRunnerOutputType.success) {
          count.success++;
        }

        if (count.error === count.expected) {
          p.resolve();
        }
      });
    const __handlerFn: ShardRunnerProvidedSingleItemHandler<
      ITestItem
    > = async () => {
      return {
        type: kShardRunnerOutputType.error,
        error: new Error('Test error'),
      };
    };
    const handlerFn = vi.fn().mockImplementation(__handlerFn);

    async function queueItem(id: string) {
      const outputChannel = getShardRunnerPubSubOutputChannel({
        queueKey,
        id,
      });
      const item: IShardRunnerEntry<ITestItem> = {
        id,
        item: {id},
        outputChannel,
        agent: sessionAgent,
      };
      const message: IShardRunnerMessage = {
        msg: JSON.stringify(item),
      };

      await kIjxUtils.queue().addMessages(queueKey, [message]);
      await kIjxUtils.pubsub().subscribeJson(item.outputChannel, outputFn);

      return item;
    }

    const items01 = await Promise.all([queueItem('01'), queueItem('02')]);
    const items02 = await Promise.all([queueItem('03'), queueItem('04')]);

    await singleItemHandleShardQueue({
      queueKey,
      readCount: 2,
      providedHandler: handlerFn,
    });

    await p.promise;

    const [call01, call02, call03, call04] = handlerFn.mock.calls;
    expect(pJSON(call01)).toEqual(pJSON([{item: items01[0]}]));
    expect(pJSON(call02)).toEqual(pJSON([{item: items01[1]}]));
    expect(pJSON(call03)).toEqual(pJSON([{item: items02[0]}]));
    expect(pJSON(call04)).toEqual(pJSON([{item: items02[1]}]));

    const itemsCombined = [...items01, ...items02];
    expect(acks).toHaveLength(4);
    acks.forEach((ack, index) => {
      expect(ack).toMatchObject({
        id: itemsCombined[index].id,
        type: kShardRunnerOutputType.ack,
      });
    });

    expect(outputs).toHaveLength(4);
    outputs.forEach((output, index) => {
      expect(output).toMatchObject({
        id: itemsCombined[index].id,
        type: kShardRunnerOutputType.error,
        error: {
          message: 'Test error',
          name: 'Error',
        },
      });
    });
  });
});

describe('shardRunner handler > multiItemsHandleShardQueue', () => {
  test('multiItemsHandleShardQueue outputs', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const queueKey = 'test' + Math.random();
    const count = {ack: 0, success: 0, error: 0, expected: 4};
    const p = getDeferredPromise();
    const acks: IShardRunnerOutput<ITestItem>[] = [];
    const outputs: IShardRunnerOutput<ITestItem>[] = [];
    const outputFn = vi
      .fn()
      .mockImplementation(async (output: IShardRunnerOutput<ITestItem>) => {
        if (output.type === kShardRunnerOutputType.ack) {
          count.ack++;
          acks.push(output);
        } else if (output.type === kShardRunnerOutputType.success) {
          count.success++;
          outputs.push(output);
        } else if (output.type === kShardRunnerOutputType.error) {
          count.error++;
        }

        if (count.success === count.expected) {
          p.resolve();
        }
      });
    const __handlerFn: ShardRunnerProvidedMultiItemsHandler<
      ITestItem
    > = async params => {
      return params.items.reduce((acc, item) => {
        acc[item.id] = {
          type: kShardRunnerOutputType.success,
          item,
        };
        return acc;
      }, {} as ShardRunnerProvidedHandlerResultMap<ITestItem>);
    };
    const handlerFn = vi.fn().mockImplementation(__handlerFn);

    async function queueItem(id: string) {
      const outputChannel = getShardRunnerPubSubOutputChannel({
        queueKey,
        id,
      });
      const item: IShardRunnerEntry<ITestItem> = {
        id,
        item: {id},
        outputChannel,
        agent: sessionAgent,
      };
      const message: IShardRunnerMessage = {
        msg: JSON.stringify(item),
      };

      await kIjxUtils.queue().addMessages(queueKey, [message]);
      await kIjxUtils.pubsub().subscribeJson(item.outputChannel, outputFn);

      return item;
    }

    const items01 = await Promise.all([queueItem('01'), queueItem('02')]);
    const items02 = await Promise.all([queueItem('03'), queueItem('04')]);

    await multiItemsHandleShardQueue({
      queueKey,
      readCount: 2,
      providedHandler: handlerFn,
    });

    await p.promise;

    const [call01, call02, call03, call04] = handlerFn.mock.calls;
    expect(pJSON(call01)).toEqual(pJSON([{items: [items01[0], items01[1]]}]));
    expect(pJSON(call02)).toEqual(pJSON([{items: [items02[0], items02[1]]}]));

    const itemsCombined = [...items01, ...items02];
    expect(acks).toHaveLength(4);
    acks.forEach((ack, index) => {
      expect(ack).toMatchObject({
        id: itemsCombined[index].id,
        type: kShardRunnerOutputType.ack,
      });
    });

    expect(outputs).toHaveLength(4);
    outputs.forEach((output, index) => {
      expect(output).toMatchObject({
        id: itemsCombined[index].id,
        type: kShardRunnerOutputType.success,
        item: itemsCombined[index].item,
      });
    });
  });

  test('multiItemsHandleShardQueue error', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const queueKey = 'test' + Math.random();
    const count = {ack: 0, error: 0, success: 0, expected: 4};
    const p = getDeferredPromise();
    const acks: IShardRunnerOutput<ITestItem>[] = [];
    const outputs: IShardRunnerOutput<ITestItem>[] = [];
    const outputFn = vi
      .fn()
      .mockImplementation(async (output: IShardRunnerOutput<ITestItem>) => {
        if (output.type === kShardRunnerOutputType.ack) {
          count.ack++;
          acks.push(output);
        } else if (output.type === kShardRunnerOutputType.error) {
          count.error++;
          outputs.push(output);
        } else if (output.type === kShardRunnerOutputType.success) {
          count.success++;
        }

        if (count.error === count.expected) {
          p.resolve();
        }
      });
    const __handlerFn: ShardRunnerProvidedMultiItemsHandler<
      ITestItem
    > = async params => {
      return params.items.reduce((acc, item) => {
        acc[item.id] = {
          type: kShardRunnerOutputType.error,
          error: new Error('Test error'),
        };
        return acc;
      }, {} as ShardRunnerProvidedHandlerResultMap<ITestItem>);
    };
    const handlerFn = vi.fn().mockImplementation(__handlerFn);

    async function queueItem(id: string) {
      const outputChannel = getShardRunnerPubSubOutputChannel({
        queueKey,
        id,
      });
      const item: IShardRunnerEntry<ITestItem> = {
        id,
        item: {id},
        outputChannel,
        agent: sessionAgent,
      };
      const message: IShardRunnerMessage = {
        msg: JSON.stringify(item),
      };

      await kIjxUtils.queue().addMessages(queueKey, [message]);
      await kIjxUtils.pubsub().subscribeJson(item.outputChannel, outputFn);

      return item;
    }

    const items01 = await Promise.all([queueItem('01'), queueItem('02')]);
    const items02 = await Promise.all([queueItem('03'), queueItem('04')]);

    await multiItemsHandleShardQueue({
      queueKey,
      readCount: 2,
      providedHandler: handlerFn,
    });

    await p.promise;

    const [call01, call02] = handlerFn.mock.calls;
    expect(pJSON(call01)).toEqual(pJSON([{items: [items01[0], items01[1]]}]));
    expect(pJSON(call02)).toEqual(pJSON([{items: [items02[0], items02[1]]}]));

    const itemsCombined = [...items01, ...items02];
    expect(acks).toHaveLength(4);
    acks.forEach((ack, index) => {
      expect(ack).toMatchObject({
        id: itemsCombined[index].id,
        type: kShardRunnerOutputType.ack,
      });
    });

    expect(outputs).toHaveLength(4);
    outputs.forEach((output, index) => {
      expect(output).toMatchObject({
        id: itemsCombined[index].id,
        type: kShardRunnerOutputType.error,
        error: {
          message: 'Test error',
          name: 'Error',
        },
      });
    });
  });
});
