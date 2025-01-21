import assert from 'assert';
import {isNumber} from 'lodash-es';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {kUsageProviderConstants} from '../../../contexts/usage/constants.js';
import {File} from '../../../definitions/file.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {appAssert} from '../../../utils/assertion.js';
import {ValidationError} from '../../../utils/errors.js';
import {
  singleItemHandleShardQueue,
  startShardRunner,
  stopShardRunner,
} from '../../../utils/shardRunner/handler.js';
import {
  IShardRunnerEntry,
  kShardRunnerOutputType,
  ShardRunnerProvidedHandlerResult,
} from '../../../utils/shardRunner/types.js';
import {kFileConstants} from '../constants.js';
import {
  createNewFileAndEnsureFolders,
  FilepathInfo,
  getFilepathInfo,
} from '../utils.js';
import {prepareExistingFile, tryGetFile} from './prepareExistingFile.js';
import {
  IPrepareFileQueueInput,
  IPrepareFileQueueOutput,
  UploadFileEndpointParams,
} from './types.js';

async function createAndInsertNewFile(params: {
  agent: SessionAgent;
  workspace: Pick<Workspace, 'resourceId' | 'rootname'>;
  pathinfo: FilepathInfo;
  data: Pick<
    File,
    'description' | 'encoding' | 'mimetype' | 'clientMultipartId'
  >;
  opts: SemanticProviderMutationParams;
  seed?: Partial<File>;
}) {
  const {agent, workspace, pathinfo, data, opts, seed} = params;
  const {file, parentFolder} = await createNewFileAndEnsureFolders(
    agent,
    workspace,
    pathinfo,
    data,
    seed,
    /** parentFolder */ null
  );

  await kSemanticModels.file().insertItem(file, opts);
  return {file, parentFolder};
}

async function getAndPrepareExistingFile(params: {
  agent: SessionAgent;
  workspace: Workspace;
  data: Pick<
    UploadFileEndpointParams,
    'filepath' | 'fileId' | 'clientMultipartId'
  >;
}) {
  const {agent, workspace, data} = params;
  return await kSemanticModels.utils().withTxn(async opts => {
    const {file} = await tryGetFile(
      {workspaceId: workspace.resourceId, ...data},
      opts
    );

    if (file) {
      const preparedFile = await prepareExistingFile({
        agent,
        workspace,
        file,
        data,
        opts,
        skipAuth: false,
      });

      appAssert(preparedFile);
      return preparedFile;
    }

    return undefined;
  });
}

async function createAndPrepareNewFile(params: {
  agent: SessionAgent;
  workspace: Workspace;
  data: Pick<
    UploadFileEndpointParams,
    'filepath' | 'clientMultipartId' | 'part' | 'fileId'
  >;
}) {
  const {agent, workspace, data} = params;

  appAssert(
    data.filepath,
    new ValidationError('Provide a filepath for new files')
  );

  const pathinfo = getFilepathInfo(data.filepath, {
    containsRootname: true,
    allowRootFolder: false,
  });

  return await kSemanticModels.utils().withTxn(async opts => {
    // it's safe (but a bit costly and confusing) to create parent folders and
    // file before checking auth. whatsoever queue and handler that's creating the
    // parent folders will fail if the user doesn't have permission to create
    // them. lastly, we're creating the file with a transaction, so if the auth
    // check fails, the transaction will be rolled back.
    const {file, parentFolder} = await createAndInsertNewFile({
      agent,
      workspace,
      pathinfo,
      data,
      opts,
    });

    const preparedFile = await prepareExistingFile({
      agent,
      workspace,
      file,
      data,
      opts,
      closestExistingFolder: parentFolder,
      skipAuth: false,
    });

    appAssert(preparedFile);
    return preparedFile;
  });
}

async function handlePrepareFileEntry(params: {
  entry: IShardRunnerEntry<IPrepareFileQueueInput>;
}): Promise<ShardRunnerProvidedHandlerResult<IPrepareFileQueueOutput>> {
  const {entry} = params;
  const agent = entry.agent;
  const input = entry.item;

  const [sessionAgent, workspace] = await Promise.all([
    kUtilsInjectables.session().getAgentByAgentTokenId(agent.agentTokenId),
    kSemanticModels.workspace().getOneById(input.workspace.resourceId),
  ]);
  assert.ok(workspace);

  const filepathOrId = input.data.filepath ?? input.data.fileId;
  assert.ok(filepathOrId);
  const lockName = kFileConstants.getPrepareFileLockName(filepathOrId);

  const existingFile = await getAndPrepareExistingFile({
    workspace,
    agent: sessionAgent,
    data: input.data,
  });

  if (existingFile) {
    return {
      type: kShardRunnerOutputType.success,
      item: existingFile,
    };
  }

  if (kUtilsInjectables.locks().has(lockName)) {
    await kUtilsInjectables.locks().wait({
      name: lockName,
      timeoutMs: kFileConstants.getPrepareFileLockWaitTimeoutMs,
    });

    const existingFile = await getAndPrepareExistingFile({
      workspace,
      agent: sessionAgent,
      data: input.data,
    });

    assert.ok(existingFile);
    return {
      type: kShardRunnerOutputType.success,
      item: existingFile,
    };
  }

  return await kUtilsInjectables.locks().run(lockName, async () => {
    const result = await createAndPrepareNewFile({
      agent: sessionAgent,
      workspace,
      data: input.data,
    });

    return {
      type: kShardRunnerOutputType.success,
      item: result,
    };
  });
}

function getPrepareFileQueueKey(queueNo: number) {
  assert.ok(isNumber(queueNo));
  return kFileConstants.getPrepareFileQueueWithNo(queueNo);
}

async function handlePrepareFileQueue(inputQueueNo: number) {
  const key = getPrepareFileQueueKey(inputQueueNo);
  singleItemHandleShardQueue({
    queueKey: key,
    readCount: kUsageProviderConstants.addUsageRecordProcessCount,
    providedHandler: async params => {
      return await handlePrepareFileEntry({entry: params.item});
    },
  });
}

export function startHandlePrepareFileQueue(inputQueueNo: number) {
  const key = getPrepareFileQueueKey(inputQueueNo);
  startShardRunner({
    queueKey: key,
    handlerFn: () => handlePrepareFileQueue(inputQueueNo),
  });
}

// TODO: currently not used
export async function stopHandlePrepareFileQueue(inputQueueNo: number) {
  const key = getPrepareFileQueueKey(inputQueueNo);
  await stopShardRunner({queueKey: key});
}
