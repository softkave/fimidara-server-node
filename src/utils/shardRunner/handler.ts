import {isUndefined} from 'lodash-es';
import {AnyFn} from 'softkave-js-utils';
import {kIkxUtils} from '../../contexts/ijx/injectables.js';
import {
  IShardRunnerEntry,
  IShardRunnerMessage,
  IShardRunnerOutput,
  kShardRunnerOutputType,
  kShardRunnerPubSubAlertMessage,
  ShardRunnerProvidedHandlerResult,
  ShardRunnerProvidedMultiItemsHandler,
  ShardRunnerProvidedSingleItemHandler,
} from './types.js';
import {
  getShardRunnerPubSubAlertChannel,
  isActiveShardRunner,
  setActiveShardRunner,
  unsetActiveShardRunner,
} from './utils.js';

async function getNextItems(params: {queueKey: string; readCount: number}) {
  const {queueKey, readCount} = params;
  const rawItems = await kIkxUtils
    .queue()
    .getMessages(queueKey, readCount, /** remove */ true);
  const items = rawItems.map(next => {
    const message = next.message as IShardRunnerMessage;
    const item = JSON.parse(message.msg);
    return item as IShardRunnerEntry<unknown>;
  });

  return items;
}

function ackItems(params: {items: IShardRunnerEntry<unknown>[]}) {
  const {items} = params;

  if (kIkxUtils.runtimeState().getIsEnded()) {
    kIkxUtils.logger().log('dropping ack items because server is ending');
    kIkxUtils.logger().log(JSON.stringify(items, null, 2));
    return;
  }

  kIkxUtils.promises().callAndForget(() =>
    items.map(async next => {
      const ack: IShardRunnerOutput<unknown> = {
        type: kShardRunnerOutputType.ack,
        id: next.id,
      };
      await kIkxUtils.pubsub().publish(next.outputChannel, ack);
    })
  );
}

function outputItems(params: {
  items: IShardRunnerEntry<unknown>[];
  resultsMap: Record<string, ShardRunnerProvidedHandlerResult<unknown>>;
}) {
  const {items, resultsMap} = params;

  if (kIkxUtils.runtimeState().getIsEnded()) {
    kIkxUtils.logger().log('dropping output items because server is ending');
    kIkxUtils.logger().log(JSON.stringify(items, null, 2));
    kIkxUtils.logger().log(JSON.stringify(resultsMap, null, 2));
    return;
  }

  kIkxUtils.promises().callAndForget(() =>
    items.map(async next => {
      const result = resultsMap[next.id];
      let output: IShardRunnerOutput<unknown> | undefined;

      if (result.type === kShardRunnerOutputType.success) {
        output = {
          type: kShardRunnerOutputType.success,
          id: next.id,
          item: result.item,
        };
      } else if (result.type === kShardRunnerOutputType.error) {
        output = {
          type: kShardRunnerOutputType.error,
          id: next.id,
          error: result.error,
        };
      }

      if (output) {
        await kIkxUtils.pubsub().publish(next.outputChannel, output);
      }
    })
  );
}

export async function handleShardQueue(params: {
  queueKey: string;
  readCount: number;
  handlerFn: AnyFn<[IShardRunnerEntry<unknown>[]], Promise<void>>;
  __previousRunHasItems?: boolean;
}) {
  const {handlerFn, __previousRunHasItems} = params;
  const items = await getNextItems(params);

  if (items.length) {
    ackItems({items});
    await handlerFn(items);
  }

  if (
    __previousRunHasItems ||
    isUndefined(__previousRunHasItems) ||
    items.length
  ) {
    const isEnded = kIkxUtils.runtimeState().getIsEnded();
    if (!isEnded) {
      kIkxUtils
        .promises()
        .callAndForget(() =>
          handleShardQueue({...params, __previousRunHasItems: !!items.length})
        );
    }
  } else {
    unsetActiveShardRunner({queueKey: params.queueKey});
  }
}

export async function multiItemsHandleShardQueue(params: {
  queueKey: string;
  readCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providedHandler: ShardRunnerProvidedMultiItemsHandler<any>;
}) {
  const {providedHandler} = params;
  await handleShardQueue({
    ...params,
    handlerFn: async items => {
      try {
        const resultsMap = await providedHandler({items});
        outputItems({items, resultsMap});
      } catch (error) {
        kIkxUtils.logger().error(error);
        outputItems({
          items,
          resultsMap: items.reduce(
            (acc, item) => {
              acc[item.id] = {type: kShardRunnerOutputType.error, error};
              return acc;
            },
            {} as Record<string, ShardRunnerProvidedHandlerResult<unknown>>
          ),
        });
      }
    },
  });
}

export async function singleItemHandleShardQueue(params: {
  queueKey: string;
  readCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providedHandler: ShardRunnerProvidedSingleItemHandler<any>;
}) {
  const {providedHandler} = params;
  await handleShardQueue({
    ...params,
    handlerFn: async items => {
      for (const item of items) {
        try {
          const result = await providedHandler({item});
          outputItems({items: [item], resultsMap: {[item.id]: result}});
        } catch (error) {
          kIkxUtils.logger().error(error);
          outputItems({
            items: [item],
            resultsMap: {
              [item.id]: {type: kShardRunnerOutputType.error, error},
            },
          });
        }
      }
    },
  });
}

export function startShardRunner(params: {queueKey: string; handlerFn: AnyFn}) {
  const {queueKey, handlerFn} = params;
  const wakeupChannel = getShardRunnerPubSubAlertChannel({queueKey});

  const isServerEnded = () => kIkxUtils.runtimeState().getIsEnded();

  const runHandler = () => {
    const isActive = isActiveShardRunner({queueKey});

    if (!isActive && !isServerEnded()) {
      setActiveShardRunner({queueKey});
      kIkxUtils.promises().callAndForget(handlerFn);
    }
  };

  if (!isServerEnded()) {
    // run handler immediately to consume what's in the queue
    runHandler();

    // subscribe to wakeup channel to run handler when new items are added
    kIkxUtils.pubsub().subscribe(wakeupChannel, msg => {
      if (msg === kShardRunnerPubSubAlertMessage) {
        runHandler();
      }
    });
  }
}

export async function stopShardRunner(params: {queueKey: string}) {
  const {queueKey} = params;
  const wakeupChannel = getShardRunnerPubSubAlertChannel({queueKey});
  await kIkxUtils.pubsub().unsubscribe(wakeupChannel);
  unsetActiveShardRunner({queueKey});
}
