import {kShardRunnerOutputType} from '../../../utils/shardRunner/types.js';

import {IInternalMultipartIdQueueOutput} from './types.js';

import assert from 'assert';
import {isNumber} from 'lodash-es';
import {kIncludeInProjection} from '../../../contexts/data/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kUsageProviderConstants} from '../../../contexts/usage/constants.js';
import {
  singleItemHandleShardQueue,
  startShardRunner,
  stopShardRunner,
} from '../../../utils/shardRunner/handler.js';
import {
  IShardRunnerEntry,
  ShardRunnerProvidedHandlerResult,
} from '../../../utils/shardRunner/types.js';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils.js';
import {kFileConstants} from '../constants.js';
import {getNextMultipartTimeout} from '../utils/getNextMultipartTimeout.js';
import {IInternalMultipartIdQueueInput} from './types.js';

async function addFileInternalMultipartId(params: {
  input: IInternalMultipartIdQueueInput;
}): Promise<IInternalMultipartIdQueueOutput> {
  const {input} = params;

  // TODO: find a way to cache calls to resolveBackendsMountsAndConfigs
  const {primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs({
    file: {workspaceId: input.workspaceId, namepath: input.namepath},
    initPrimaryBackendOnly: true,
  });

  const startResult = await primaryBackend.startMultipartUpload({
    filepath: input.mountFilepath,
    workspaceId: input.workspaceId,
    fileId: input.fileId,
    mount: primaryMount,
  });

  await kIjxSemantic.utils().withTxn(async opts => {
    const multipartTimeout = getNextMultipartTimeout();
    await kIjxSemantic.file().updateOneById(
      input.fileId,
      {
        multipartTimeout,
        internalMultipartId: startResult.multipartId,
        clientMultipartId: input.clientMultipartId,
      },
      opts
    );
  });

  return startResult;
}

async function getFileInternalMultipartId(params: {
  input: IInternalMultipartIdQueueInput;
}): Promise<string | undefined> {
  const {input} = params;
  const dbFile = await kIjxSemantic.file().getOneById(input.fileId, {
    projection: {internalMultipartId: kIncludeInProjection},
  });

  return dbFile?.internalMultipartId ?? undefined;
}

async function handleAddInternalMultipartIdEntry(params: {
  entry: IShardRunnerEntry<IInternalMultipartIdQueueInput>;
}): Promise<ShardRunnerProvidedHandlerResult<IInternalMultipartIdQueueOutput>> {
  const {entry} = params;
  const input = entry.item;
  const lockName = kFileConstants.getAddInternalMultipartIdLockName(
    input.fileId
  );

  const existingInternalId = await getFileInternalMultipartId({input});
  if (existingInternalId) {
    return {
      type: kShardRunnerOutputType.success,
      item: {
        multipartId: existingInternalId,
      },
    };
  }

  if (kIjxUtils.locks().has(lockName)) {
    await kIjxUtils.locks().wait({
      name: lockName,
      timeoutMs: kFileConstants.getAddInternalMultipartIdLockWaitTimeoutMs,
    });

    const internalId = await getFileInternalMultipartId({input});
    assert.ok(internalId);

    return {
      type: kShardRunnerOutputType.success,
      item: {
        multipartId: internalId,
      },
    };
  }

  return await kIjxUtils.locks().run(lockName, async () => {
    const result = await addFileInternalMultipartId({input});
    return {
      type: kShardRunnerOutputType.success,
      item: result,
    };
  });
}

function getAddInternalMultipartIdQueueKey(queueNo: number) {
  assert.ok(isNumber(queueNo));
  return kFileConstants.getAddInternalMultipartIdQueueWithNo(queueNo);
}

async function handleAddInternalMultipartIdQueue(inputQueueNo: number) {
  const key = getAddInternalMultipartIdQueueKey(inputQueueNo);
  await singleItemHandleShardQueue({
    queueKey: key,
    readCount: kUsageProviderConstants.addUsageRecordProcessCount,
    providedHandler: async params => {
      return await handleAddInternalMultipartIdEntry({entry: params.item});
    },
  });
}

export function startHandleAddInternalMultipartIdQueue(inputQueueNo: number) {
  const key = getAddInternalMultipartIdQueueKey(inputQueueNo);
  startShardRunner({
    queueKey: key,
    handlerFn: () => handleAddInternalMultipartIdQueue(inputQueueNo),
  });
}

// TODO: currently not used
export async function stopHandleAddInternalMultipartIdQueue(
  inputQueueNo: number
) {
  const key = getAddInternalMultipartIdQueueKey(inputQueueNo);
  await stopShardRunner({queueKey: key});
}
