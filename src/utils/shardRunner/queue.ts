import {getDeferredPromise, getNewId, TimeoutError} from 'softkave-js-utils';
import {DisposableTimeout} from 'softkave-js-utils/other/DisposableTimeout.js';
import {kIkxUtils} from '../../contexts/ijx/injectables.js';
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
    kIkxUtils.disposables().remove(vars.timeout);
  }

  if (vars.listener) {
    kIkxUtils;
    kIkxUtils
      .promises()
      .callAndForget(() =>
        kIkxUtils.pubsub().unsubscribe(vars.channel, vars.listener!)
      );
  }

  if (!vars.isDone()) {
    vars.reject(new ServerError());
  }

  if (vars.isPromiseResolved() === false && vars.queueId.length > 0) {
    // remove message from queue if promise was not resolved
    kIkxUtils
      .promises()
      .callAndForget(() =>
        kIkxUtils.queue().deleteMessages(vars.queueKey, vars.queueId)
      );
  }

  vars.listener = null;
}

export async function queueShardRunner<TInputItem, TOutputItem>(params: {
  agent: Agent;
  workspaceId: string;
  item: TInputItem;
  queueKey: string;
  timeoutMs: number;
}) {
  const {agent, workspaceId, item, queueKey, timeoutMs} = params;

  const id = getNewId();
  const wakeupChannel = getShardRunnerPubSubAlertChannel({queueKey});
  const outputChannel = getShardRunnerPubSubOutputChannel({queueKey, id});
  const input: IShardRunnerEntry<TInputItem> = {
    agent: {
      agentId: agent.agentId,
      agentType: agent.agentType,
      agentTokenId: agent.agentTokenId,
    },
    workspaceId,
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

    await kIkxUtils.pubsub().subscribeJson(outputChannel, vars.listener);
    vars.queueId = await kIkxUtils.queue().addMessages(queueKey, [message]);
    vars.timeout = new DisposableTimeout(timeoutMs, () => {
      vars.reject(new TimeoutError('timeout'));
    });

    kIkxUtils.disposables().add(vars.timeout);
    kIkxUtils
      .promises()
      .callAndForget(() =>
        kIkxUtils
          .pubsub()
          .publish(wakeupChannel, kShardRunnerPubSubAlertMessage)
      );
  } catch (error) {
    kIkxUtils.logger().error(error);
    vars.reject(error);
  }

  return vars.promise;
}
