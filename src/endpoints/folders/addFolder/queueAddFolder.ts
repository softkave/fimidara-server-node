import {getDeferredPromise, getNewId, TimeoutError} from 'softkave-js-utils';
import {DisposableTimeout} from 'softkave-js-utils/other/DisposableTimeout.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {QueueContextSubscribeJsonFn} from '../../../contexts/pubsub/types.js';
import {IQueueMessage} from '../../../contexts/queue/types.js';
import {Folder} from '../../../definitions/folder.js';
import {Agent} from '../../../definitions/system.js';
import {kStringFalse, kStringTrue} from '../../../utils/constants.js';
import {ServerError} from '../../../utils/errors.js';
import {kFolderConstants} from '../constants.js';
import {
  IAddFolderQueueInput,
  IAddFolderQueueOutput,
  kAddFolderQueueOutputType,
  NewFolderInput,
} from './types.js';

interface IRunArtifacts
  extends ReturnType<typeof getDeferredPromise<Folder[]>> {
  timeout: DisposableTimeout | null;
  queueKey: string;
  channel: string;
  queueId: string[];
  listener: QueueContextSubscribeJsonFn | null;
}

function cleanup(vars: IRunArtifacts) {
  if (vars.timeout) {
    vars.timeout.dispose();
    kUtilsInjectables.disposables().remove(vars.timeout);
  }

  if (vars.listener) {
    // TODO: will this delete the pubsub channel?
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

// TODO: we currently have to insert an input one by one, we should be able to
// insert multiple inputs at once
export async function queueAddFolder(
  agent: Agent,
  workspaceId: string,
  input: NewFolderInput,
  UNSAFE_skipAuthCheck = false,
  throwIfFolderExists = false
) {
  const channel = kFolderConstants.getAddFolderPubSubChannel(input.folderpath);
  const queueKey = kFolderConstants.getAddFolderQueueKey(input.folderpath);
  const message: IAddFolderQueueInput = {
    channel,
    workspaceId,
    UNSAFE_skipAuthCheck: UNSAFE_skipAuthCheck ? kStringTrue : kStringFalse,
    throwIfFolderExists: throwIfFolderExists ? kStringTrue : kStringFalse,
    id: getNewId(),
    agentId: agent.agentId,
    agentTokenId: agent.agentTokenId,
    agentType: agent.agentType,
    folderpath: input.folderpath,
    description: input.description,
  };

  const timeoutMs =
    kUtilsInjectables.suppliedConfig().addFolderTimeoutMs ||
    kFolderConstants.addFolderQueueTimeout;
  const vars: IRunArtifacts = {
    queueKey,
    channel,
    queueId: [],
    listener: null,
    timeout: null,
    ...getDeferredPromise<Folder[]>(),
  };

  vars.promise.finally(() => cleanup(vars));
  vars.listener = response => {
    if (vars.isDone()) {
      return;
    }

    const output = response as IAddFolderQueueOutput;

    if (output.type === kAddFolderQueueOutputType.ack) {
      if (vars.timeout) {
        vars.timeout.extend(timeoutMs);
      }
    } else if (output.type === kAddFolderQueueOutputType.success) {
      vars.resolve(output.folders);
    } else {
      vars.reject(output.error);
    }
  };

  try {
    await kUtilsInjectables.pubsub().subscribeJson(channel, vars.listener);
    vars.queueId = await kUtilsInjectables
      .queue()
      .addMessages(queueKey, [message] as unknown as IQueueMessage[]);
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
