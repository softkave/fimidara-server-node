import {getDeferredPromise, getNewId, TimeoutError} from 'softkave-js-utils';
import {DisposableTimeout} from 'softkave-js-utils/other/DisposableTimeout.js';
import {kIjxUtils} from '../../contexts/ijx/injectables.js';
import {QueueContextSubscribeJsonFn} from '../../contexts/pubsub/types.js';
import {Agent} from '../../definitions/system.js';
import {ServerError} from '../errors.js';
import {
  IShardRunnerEntry,
  IShardRunnerMessage,
  IShardRunnerOutput,
  kShardRunnerOutputType,
  kShardRunnerPubSubAlertMessage,
} from './types.js';
import {
  getShardRunnerPubSubAlertChannel,
  getShardRunnerPubSubOutputChannel,
} from './utils.js';

interface IRunArtifacts<TOutputItem>
  extends ReturnType<typeof getDeferredPromise<TOutputItem>> {
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
    kIjxUtils.disposables().remove(vars.timeout);
  }

  if (vars.listener) {
    kIjxUtils;
    kIjxUtils
      .promises()
      .callAndForget(() =>
        kIjxUtils.pubsub().unsubscribe(vars.channel, vars.listener!)
      );
  }

  if (!vars.isDone()) {
    vars.reject(new ServerError());
  }

  if (vars.isPromiseResolved() === false && vars.queueId.length > 0) {
    // remove message from queue if promise was not resolved
    kIjxUtils
      .promises()
      .callAndForget(() =>
        kIjxUtils.queue().deleteMessages(vars.queueKey, vars.queueId)
      );
  }

  vars.listener = null;
}

export async function queueShardRunner<TInputItem, TOutputItem>(params: {
  agent: Agent;
  item: TInputItem;
  queueKey: string;
  timeoutMs: number;
}) {
  const {agent, item, queueKey, timeoutMs} = params;

  const id = getNewId();
  const wakeupChannel = getShardRunnerPubSubAlertChannel({queueKey});
  const outputChannel = getShardRunnerPubSubOutputChannel({queueKey, id});
  const input: IShardRunnerEntry<TInputItem> = {
    agent: {
      agentId: agent.agentId,
      agentType: agent.agentType,
      agentTokenId: agent.agentTokenId,
    },
    item,
    id,
    outputChannel: outputChannel,
  };
  const vars: IRunArtifacts<TOutputItem> = {
    queueKey,
    channel: outputChannel,
    queueId: [],
    listener: null,
    timeout: null,
    ...getDeferredPromise<TOutputItem>(),
  };

  vars.promise.finally(() => cleanup(vars));
  vars.listener = response => {
    if (vars.isDone()) {
      return;
    }

    const output = response as IShardRunnerOutput<TOutputItem>;

    if (output.type === kShardRunnerOutputType.ack) {
      if (vars.timeout) {
        vars.timeout.extend(timeoutMs);
      }
    } else if (output.type === kShardRunnerOutputType.success) {
      vars.resolve(output.item);
    } else {
      vars.reject(output.error);
    }
  };

  try {
    const message: IShardRunnerMessage = {
      msg: JSON.stringify(input),
    };

    await kIjxUtils.pubsub().subscribeJson(outputChannel, vars.listener);
    vars.queueId = await kIjxUtils.queue().addMessages(queueKey, [message]);
    vars.timeout = new DisposableTimeout(timeoutMs, () => {
      vars.reject(new TimeoutError('timeout'));
    });

    kIjxUtils.disposables().add(vars.timeout);
    kIjxUtils
      .promises()
      .callAndForget(() =>
        kIjxUtils
          .pubsub()
          .publish(wakeupChannel, kShardRunnerPubSubAlertMessage)
      );
  } catch (error) {
    kIjxUtils.logger().error(error);
    vars.reject(error);
  }

  return vars.promise;
}
