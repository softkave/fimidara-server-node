import assert from 'assert';
import {forEach, groupBy, isNumber, keyBy, map, uniqBy} from 'lodash-es';
import {pathJoin} from 'softkave-js-utils';
import {
  checkAuthorizationWithAgent,
  getResourcePermissionContainers,
} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {Folder} from '../../../definitions/folder.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {Resource, SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {kAppMessages} from '../../../utils/messages.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {
  multiItemsHandleShardQueue,
  startShardRunner,
  stopShardRunner,
} from '../../../utils/shardRunner/handler.js';
import {
  IShardRunnerEntry,
  kShardRunnerOutputType,
  ShardRunnerProvidedHandlerResultMap,
} from '../../../utils/shardRunner/types.js';
import {NotFoundError} from '../../errors.js';
import {PermissionDeniedError} from '../../users/errors.js';
import {kFolderConstants} from '../constants.js';
import {createNewFolder} from '../utils.js';
import {getExistingFoldersAndArtifacts} from './getExistingFoldersAndArtifacts.js';
import {prepareFolderInputList} from './prepareFolderInputList.js';
import {
  IAddFolderQueueShardRunnerInput,
  IAddFolderQueueShardRunnerOutput,
  IAddFolderQueueWorkingInput,
} from './types.js';

interface IOwnWorkingInput {
  id: string;
  target: Resource;
  agent: SessionAgent;
  UNSAFE_skipAuthCheck: boolean;
  hasAccess: boolean;
  folderpath: string;
}

interface IPossibleNewFolder {
  folder: Folder;
  folderpath: string;
  inputFolderpath: string;
}

async function checkAuthOnTarget(
  workspace: Workspace,
  input: Pick<IOwnWorkingInput, 'agent' | 'target' | 'UNSAFE_skipAuthCheck'>,
  opts: SemanticProviderMutationParams
) {
  if (input.UNSAFE_skipAuthCheck) {
    return {
      hasAccess: true,
      key: `${input.target.resourceId}+${input.agent.agentId}`,
    };
  }

  const checks = await checkAuthorizationWithAgent({
    workspace,
    opts,
    agent: input.agent,
    workspaceId: workspace.resourceId,
    target: {
      action: kFimidaraPermissionActions.addFolder,
      targetId: getResourcePermissionContainers(
        workspace.resourceId,
        input.target,
        /** includeResourceId */ true
      ),
    },
    nothrow: true,
  });

  return {
    hasAccess: checks.every(check => check.hasAccess),
    key: `${input.target.resourceId}+${input.agent.agentId}`,
  };
}

async function checkAuthOnManyTargets(
  workspace: Workspace,
  inputRecord: Record<string, IOwnWorkingInput>,
  opts: SemanticProviderMutationParams
) {
  const uniqInput: Record<string, IOwnWorkingInput> = {};

  for (const key in inputRecord) {
    const next = inputRecord[key];
    uniqInput[`${next.target.resourceId}+${next.agent.agentId}`] = next;
  }

  const checksRecord = keyBy(
    await Promise.all(
      map(uniqInput, next => checkAuthOnTarget(workspace, next, opts))
    ),
    next => next.key
  );

  for (const key in inputRecord) {
    const input = inputRecord[key];
    const check =
      checksRecord[`${input.target.resourceId}+${input.agent.agentId}`];
    assert.ok(check);
    input.hasAccess = check.hasAccess;
  }

  return inputRecord;
}

async function createFolderListWithTransaction(
  workspace: Workspace,
  inputList: IAddFolderQueueWorkingInput[],
  opts: SemanticProviderMutationParams
) {
  const preppedInput = prepareFolderInputList(inputList);
  const {addFolder, getFolder, getSelfOrClosestParent} =
    await getExistingFoldersAndArtifacts(
      workspace.resourceId,
      preppedInput,
      opts
    );

  const ownWorkingRecord: Record</** inputID */ string, IOwnWorkingInput> = {};
  const pNFRecord: Record<
    /** stringified namepath */ string,
    IPossibleNewFolder | undefined
  > = {};

  preppedInput.pathinfoList?.forEach((pathinfo, inputIndex) => {
    let prevFolder = getSelfOrClosestParent(pathinfo.namepath);
    const inputAtIndex = inputList[inputIndex];
    const existingDepth = prevFolder?.namepath.length ?? 0;
    const authTarget: Resource = prevFolder ?? workspace;

    // Create folders not found starting from the closest existing parent
    // represented by existingDepth. If existingDepth === namepath.length, then
    // folder exists, and no new folder is created
    pathinfo.namepath.slice(existingDepth).forEach((name, nameIndex) => {
      const actualNameIndex = nameIndex + existingDepth;
      const folder: Folder = createNewFolder(
        inputAtIndex.agent,
        workspace.resourceId,
        /** pathinfo */ {name},
        prevFolder,
        /** input */ {
          // description belongs to only the actual folder from input
          description:
            actualNameIndex === pathinfo.namepath.length - 1
              ? inputAtIndex?.description
              : undefined,
        }
      );

      // Set prevFolder to current folder, so the next folder can use it as
      // parent, and set it also in foldersByNamepath so other inputs can use it
      // (not sure how much useful the last part is, but just in case)
      addFolder(folder);
      prevFolder = folder;
      const fp = pathJoin({input: folder.namepath});
      pNFRecord[fp] = {
        folder,
        folderpath: fp,
        inputFolderpath: pathinfo.stringPath,
      };
    });

    ownWorkingRecord[inputAtIndex.id] = {
      id: inputAtIndex.id,
      target: authTarget,
      agent: inputAtIndex.agent,
      UNSAFE_skipAuthCheck: inputAtIndex.UNSAFE_skipAuthCheck ?? false,
      hasAccess: false,
      folderpath: pathinfo.stringPath,
    };
  });

  await checkAuthOnManyTargets(workspace, ownWorkingRecord, opts);
  const ownWRByFolderpath: Record<
    /** folderpath */ string,
    IOwnWorkingInput[]
  > = {};
  forEach(ownWorkingRecord, ownWR => {
    if (ownWRByFolderpath[ownWR.folderpath]) {
      ownWRByFolderpath[ownWR.folderpath].push(ownWR);
    } else {
      ownWRByFolderpath[ownWR.folderpath] = [ownWR];
    }
  });

  const newFRecord: Record<string, string> = {};
  const newPNFList = (Object.values(pNFRecord) as IPossibleNewFolder[]).filter(
    pNF => {
      const check = ownWRByFolderpath[pNF.inputFolderpath]?.some(
        ownWR => ownWR.hasAccess
      );
      return check;
    }
  );
  const newFolderList = uniqBy(newPNFList, pNF => pNF.folderpath).map(pNF => {
    newFRecord[pNF.folderpath] = pNF.folderpath;
    return pNF.folder;
  });
  await kIjxSemantic.folder().insertItem(newFolderList, opts);

  function getError(id: string) {
    if (!ownWorkingRecord[id].hasAccess) {
      return new PermissionDeniedError();
    }

    // TODO: check if is not final folder, and if it is, then this is an error,
    // because the final folder should have access check
    return;
  }

  function getFolderInfo(
    inputId: string,
    folderpath: string
  ):
    | {success: true; folder: Folder; isNew: boolean}
    | {success: false; error: Error} {
    const error = getError(inputId);
    const folder = getFolder(folderpath);
    assert(folder);

    if (error) {
      return {error, success: false};
    } else {
      return {folder, success: true, isNew: !!newFRecord[folderpath]};
    }
  }

  return {
    getFolderInfo,
    pathinfoList: preppedInput.pathinfoList,
  };
}

function bagAddFolderOutput(
  createResult: Awaited<ReturnType<typeof createFolderListWithTransaction>>,
  input: IShardRunnerEntry<IAddFolderQueueShardRunnerInput>[],
  outputMap: ShardRunnerProvidedHandlerResultMap<IAddFolderQueueShardRunnerOutput>
) {
  const {getFolderInfo, pathinfoList} = createResult;
  return pathinfoList.reduce((acc, pathinfo, i) => {
    const folders: Folder[] = [];
    const inputAtIndex = input[i];
    let error: Error | undefined;
    let isNew = false;

    for (let index = 0; index < pathinfo.namepath.length; index++) {
      const key = pathJoin({input: pathinfo.namepath.slice(0, index + 1)});
      assert.ok(inputAtIndex);
      assert.ok(
        inputAtIndex.item.folderpath === pathinfo.input,
        `${inputAtIndex.item.folderpath} !== ${pathinfo.input}`
      );

      const folder = getFolderInfo(inputAtIndex.id, key);

      if (folder.success) {
        folders.push(folder.folder);
        isNew ||= folder.isNew;
      } else {
        error = folder.error;
        break;
      }
    }

    if (inputAtIndex.item.throwIfFolderExists && !isNew) {
      error = kReuseableErrors.folder.exists();
    }

    if (error) {
      acc[inputAtIndex.id] = {type: kShardRunnerOutputType.error, error};
    } else {
      folders.sort((f1, f2) => f1.namepath.length - f2.namepath.length);
      acc[inputAtIndex.id] = {
        type: kShardRunnerOutputType.success,
        item: folders,
      };
    }

    return acc;
  }, outputMap);
}

async function populateAgent(
  input: IShardRunnerEntry<IAddFolderQueueShardRunnerInput>[]
) {
  return await Promise.all(
    input.map(async nextInput => {
      try {
        const agent = await kIjxUtils
          .session()
          .getAgentByAgentTokenId(nextInput.agent.agentTokenId);
        const workingInput: IAddFolderQueueWorkingInput = {
          agent,
          id: nextInput.id,
          workspaceId: nextInput.item.workspaceId,
          folderpath: nextInput.item.folderpath,
          UNSAFE_skipAuthCheck: nextInput.item.UNSAFE_skipAuthCheck ?? false,
          throwIfFolderExists: nextInput.item.throwIfFolderExists ?? false,
        };

        return {isError: false, workingInput};
      } catch (error) {
        return {isError: true, error, input: nextInput};
      }
    })
  );
}

async function createFolderListWithWorkspace(
  input: IShardRunnerEntry<IAddFolderQueueShardRunnerInput>[]
) {
  assert.ok(input.length);

  const workspace = await kIjxSemantic
    .workspace()
    .getOneById(input[0].item.workspaceId);
  const result: ShardRunnerProvidedHandlerResultMap<IAddFolderQueueShardRunnerOutput> =
    {};

  if (!workspace) {
    const error = new NotFoundError(kAppMessages.workspace.notFound());
    input.reduce((acc, nextInput) => {
      acc[nextInput.id] = {type: kShardRunnerOutputType.error, error};
      return acc;
    }, result);

    return result;
  }

  const workingInputRaw = await populateAgent(input);
  const workingInput = workingInputRaw
    .filter(next => !next.isError)
    .map(next => next.workingInput!);
  const errorInputList = workingInputRaw.filter(next => next.isError);

  if (errorInputList.length) {
    errorInputList.reduce((acc, next) => {
      assert.ok(next.input);
      acc[next.input.id] = {
        type: kShardRunnerOutputType.error,
        error: next.error,
      };
      return acc;
    }, result);
  } else if (workingInput.length) {
    const workingOutput = await kIjxSemantic
      .utils()
      .withTxn(opts =>
        createFolderListWithTransaction(workspace, workingInput, opts)
      );
    bagAddFolderOutput(workingOutput, input, result);
  }

  return result;
}

async function addFolderQueueCreateFolderList(
  input: IShardRunnerEntry<IAddFolderQueueShardRunnerInput>[]
) {
  const inputByWorkspace = groupBy(input, next => next.item.workspaceId);
  const result = await Promise.all(
    Object.entries(inputByWorkspace).map(async ([, input]) => {
      return await createFolderListWithWorkspace(input);
    })
  );

  return result.reduce((acc, next) => {
    return {...acc, ...next};
  }, {} as ShardRunnerProvidedHandlerResultMap<IAddFolderQueueShardRunnerOutput>);
}

function getAddFolderQueueKey(queueNo: number) {
  assert.ok(isNumber(queueNo));
  return kFolderConstants.getAddFolderQueueWithNo(queueNo);
}

async function handleAddFolderQueue(inputQueueNo: number) {
  const key = getAddFolderQueueKey(inputQueueNo);
  multiItemsHandleShardQueue({
    queueKey: key,
    readCount: kFolderConstants.addFolderProcessCount,
    providedHandler: async items => {
      return await addFolderQueueCreateFolderList(items.items);
    },
  });
}

export function startHandleAddFolderQueue(inputQueueNo: number) {
  const key = getAddFolderQueueKey(inputQueueNo);
  startShardRunner({
    queueKey: key,
    handlerFn: () => handleAddFolderQueue(inputQueueNo),
  });
}

// TODO: currently not used
export async function stopHandleAddFolderQueue(inputQueueNo: number) {
  const key = getAddFolderQueueKey(inputQueueNo);
  await stopShardRunner({queueKey: key});
}
