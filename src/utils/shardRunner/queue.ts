import {getDeferredPromise, getNewId, TimeoutError} from 'softkave-js-utils';
import {DisposableTimeout} from 'softkave-js-utils/other/DisposableTimeout.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {QueueContextSubscribeJsonFn} from '../../contexts/pubsub/types.js';
import {Agent} from '../../definitions/system.js';
import {ServerError} from '../errors.js';
import {
  IShardRunnerMessage,
  IShardRunnerQueueEntry,
  IShardRunnerQueueOutput,
  kShardRunnerQueueOutputType,
} from './types.js';

interface IRunArtifacts<TOutputItem>
  extends ReturnType<typeof getDeferredPromise<TOutputItem[]>> {
  timeout: DisposableTimeout | null;
  queueKey: string;
  channel: string;
  queueId: string[];
  listener: QueueContextSubscribeJsonFn | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanup(vars: IRunArtifacts<any>) {
  if (vars.timeout) {
    vars.timeout.dispose();
    kUtilsInjectables.disposables().remove(vars.timeout);
  }

  if (vars.listener) {
    kUtilsInjectables
      .promises()
      .forget(
        kUtilsInjectables.pubsub().unsubscribe(vars.channel, vars.listener)
      );
  }

  if (!vars.isDone()) {
    vars.reject(new ServerError());
  }

  if (vars.isPromiseResolved() === false && vars.queueId.length > 0) {
    // remove message from queue if promise was not resolved
    kUtilsInjectables
      .promises()
      .forget(
        kUtilsInjectables.queue().deleteMessages(vars.queueKey, vars.queueId)
      );
  }

  vars.listener = null;
}

export async function queueShardRunner<TInputItem, TOutputItem>(params: {
  agent: Agent;
  workspaceId: string;
  items: TInputItem[];
  pubSubChannel: string;
  queueKey: string;
  timeoutMs: number;
}) {
  const {agent, workspaceId, items, pubSubChannel, queueKey, timeoutMs} =
    params;

  const input: IShardRunnerQueueEntry<TInputItem> = {
    agent,
    workspaceId,
    items,
    pubSubChannel,
    id: getNewId(),
  };
  const vars: IRunArtifacts<TOutputItem> = {
    queueKey,
    channel: pubSubChannel,
    queueId: [],
    listener: null,
    timeout: null,
    ...getDeferredPromise<TOutputItem[]>(),
  };

  vars.promise.finally(() => cleanup(vars));
  vars.listener = response => {
    if (vars.isDone()) {
      return;
    }

    const output = response as IShardRunnerQueueOutput<TOutputItem>;

    if (output.type === kShardRunnerQueueOutputType.ack) {
      if (vars.timeout) {
        vars.timeout.extend(timeoutMs);
      }
    } else if (output.type === kShardRunnerQueueOutputType.success) {
      vars.resolve(output.items);
    } else {
      vars.reject(output.error);
    }
  };

  try {
    const message: IShardRunnerMessage = {
      msg: JSON.stringify(input),
    };
    await kUtilsInjectables
      .pubsub()
      .subscribeJson(pubSubChannel, vars.listener);
    vars.queueId = await kUtilsInjectables
      .queue()
      .addMessages(queueKey, [message]);
    vars.timeout = new DisposableTimeout(timeoutMs, () => {
      vars.reject(new TimeoutError('timeout'));
    });

    kUtilsInjectables.disposables().add(vars.timeout);
  } catch (error) {
    kUtilsInjectables.logger().error(error);
    vars.reject(error);
  }

  return vars.promise;
}
