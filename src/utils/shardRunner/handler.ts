import {isUndefined} from 'lodash-es';
import {AnyFn} from 'softkave-js-utils';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
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
  const rawItems = await kUtilsInjectables
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
  kUtilsInjectables.promises().forget(
    items.map(async next => {
      const ack: IShardRunnerOutput<unknown> = {
        type: kShardRunnerOutputType.ack,
        id: next.id,
      };
      await kUtilsInjectables.pubsub().publish(next.outputChannel, ack);
    })
  );
}

async function outputItems(params: {
  items: IShardRunnerEntry<unknown>[];
  resultsMap: Record<string, ShardRunnerProvidedHandlerResult<unknown>>;
}) {
  const {items, resultsMap} = params;
  kUtilsInjectables.promises().forget(
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
        await kUtilsInjectables.pubsub().publish(next.outputChannel, output);
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
    const isEnded = kUtilsInjectables.runtimeState().getIsEnded();
    if (!isEnded) {
      kUtilsInjectables
        .promises()
        .forget(
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
      const resultsMap = await providedHandler({items});
      outputItems({items, resultsMap});
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
        const result = await providedHandler({item});
        outputItems({items: [item], resultsMap: {[item.id]: result}});
      }
    },
  });
}

export function startShardRunner(params: {queueKey: string; handlerFn: AnyFn}) {
  const {queueKey, handlerFn} = params;
  const wakeupChannel = getShardRunnerPubSubAlertChannel({queueKey});
  const isEnded = kUtilsInjectables.runtimeState().getIsEnded();

  if (!isEnded) {
    kUtilsInjectables.pubsub().subscribe(wakeupChannel, msg => {
      const isActive = isActiveShardRunner({queueKey});

      if (msg === kShardRunnerPubSubAlertMessage && !isActive) {
        setActiveShardRunner({queueKey});
        kUtilsInjectables.promises().forget(handlerFn());
      }
    });
  }
}

export async function stopShardRunner(params: {queueKey: string}) {
  const {queueKey} = params;
  const wakeupChannel = getShardRunnerPubSubAlertChannel({queueKey});
  await kUtilsInjectables.pubsub().unsubscribe(wakeupChannel);
  unsetActiveShardRunner({queueKey});
}
