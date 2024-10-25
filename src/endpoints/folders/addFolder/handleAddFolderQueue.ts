import assert from 'assert';
import {forEach, groupBy, isNumber, keyBy, map, uniqBy} from 'lodash-es';
import {AnyFn, pathJoin} from 'softkave-js-utils';
import {
  checkAuthorizationWithAgent,
  getResourcePermissionContainers,
} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {Folder} from '../../../definitions/folder.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {Resource, SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {kStringTrue} from '../../../utils/constants.js';
import {kAppMessages} from '../../../utils/messages.js';
import {NotFoundError} from '../../errors.js';
import {PermissionDeniedError} from '../../users/errors.js';
import {kFolderConstants} from '../constants.js';
import {FolderExistsError} from '../errors.js';
import {createNewFolder} from '../utils.js';
import {getExistingFoldersAndArtifacts} from './getExistingFoldersAndArtifacts.js';
import {prepareFolderInputList} from './prepareFolderInputList.js';
import {
  IAddFolderQueueInput,
  IAddFolderQueueOutput,
  IAddFolderQueueWorkingInput,
  kAddFolderQueueOutputType,
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

type OutputByNamepath = Record<
  string,
  {isSuccess: true; folders: Folder[]} | {isSuccess: false; error: unknown}
>;

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
      UNSAFE_skipAuthCheck: inputAtIndex.UNSAFE_skipAuthCheck === kStringTrue,
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
  await kSemanticModels.folder().insertItem(newFolderList, opts);

  function getError(id: string) {
    if (!ownWorkingRecord[id].hasAccess) {
      return new PermissionDeniedError();
    }

    // TODO: check if is not final folder, and if it is, then this is an error,
    // because the final folder should have access check
    return;
  }

  function getFolderInfo(
    input: IAddFolderQueueInput,
    folderpath: string
  ):
    | {success: true; folder: Folder; isNew: boolean}
    | {success: false; error: Error} {
    const error = getError(input.id);
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
  params: Awaited<ReturnType<typeof createFolderListWithTransaction>>,
  input: IAddFolderQueueInput[]
) {
  const {getFolderInfo, pathinfoList} = params;
  return pathinfoList.reduce((acc, pathinfo, i) => {
    const folders: Folder[] = [];
    const inputAtIndex = input[i];
    let error: Error | undefined;
    let isNew = false;

    for (let index = 0; index < pathinfo.namepath.length; index++) {
      const key = pathJoin({input: pathinfo.namepath.slice(0, index + 1)});
      assert.ok(inputAtIndex);
      assert.ok(
        inputAtIndex.folderpath === pathinfo.input,
        `${inputAtIndex.folderpath} !== ${pathinfo.input}`
      );

      const folder = getFolderInfo(inputAtIndex, key);

      if (folder.success) {
        folders.push(folder.folder);
        isNew ||= folder.isNew;
      } else {
        error = folder.error;
        break;
      }
    }

    if (inputAtIndex.throwIfFolderExists === kStringTrue && !isNew) {
      error = new FolderExistsError();
    }

    if (error) {
      acc[inputAtIndex.id] = {isSuccess: false, error};
    } else {
      folders.sort((f1, f2) => f1.namepath.length - f2.namepath.length);
      acc[inputAtIndex.id] = {isSuccess: true, folders};
    }

    return acc;
  }, {} as OutputByNamepath);
}

async function publishAddFolderOutput(
  input: IAddFolderQueueInput[],
  result: OutputByNamepath
) {
  await Promise.all(
    input.map(async input => {
      const inputResult = result[input.id];
      assert.ok(inputResult);
      let output: IAddFolderQueueOutput | undefined;

      if (inputResult.isSuccess) {
        output = {
          folders: inputResult.folders,
          type: kAddFolderQueueOutputType.success,
          id: input.id,
        };
      } else {
        kUtilsInjectables.logger().error(inputResult.error);
        output = {
          error: inputResult.error,
          type: kAddFolderQueueOutputType.error,
          id: input.id,
        };
      }

      await kUtilsInjectables.pubsub().publish(input.channel, output);
    })
  );
}

async function publishAddFolderAck(input: IAddFolderQueueInput[]) {
  await Promise.all(
    input.map(async input => {
      const output: IAddFolderQueueOutput = {
        type: kAddFolderQueueOutputType.ack,
        id: input.id,
      };

      await kUtilsInjectables.pubsub().publish(input.channel, output);
    })
  );
}

async function populateAgent(input: IAddFolderQueueInput[]) {
  return await Promise.all(
    input.map(async input => {
      try {
        const agent = await kUtilsInjectables
          .session()
          .getAgentByAgentTokenId(input.agentTokenId);
        const workingInput: IAddFolderQueueWorkingInput = {
          ...input,
          agent,
        };

        return {isError: false, workingInput};
      } catch (error) {
        return {isError: true, error, input};
      }
    })
  );
}

async function createFolderListWithWorkspace(input: IAddFolderQueueInput[]) {
  if (input.length === 0) {
    return;
  }

  kUtilsInjectables.promises().forget(publishAddFolderAck(input));

  const workspace = await kSemanticModels
    .workspace()
    .getOneById(input[0].workspaceId);

  if (!workspace) {
    const error = new NotFoundError(kAppMessages.workspace.notFound());
    const result: OutputByNamepath = input.reduce((acc, nextInput) => {
      acc[nextInput.id] = {isSuccess: false, error};
      return acc;
    }, {} as OutputByNamepath);

    kUtilsInjectables.promises().forget(publishAddFolderOutput(input, result));
    return;
  }

  const workingInputRaw = await populateAgent(input);
  const workingInput = workingInputRaw
    .filter(next => !next.isError)
    .map(next => next.workingInput!);
  const errorInput = workingInputRaw.filter(next => next.isError);

  if (errorInput.length) {
    const result: OutputByNamepath = errorInput.reduce((acc, nextInput) => {
      acc[nextInput.input!.id] = {
        isSuccess: false,
        error: nextInput.error,
      };
      return acc;
    }, {} as OutputByNamepath);

    kUtilsInjectables.promises().forget(publishAddFolderOutput(input, result));
  } else if (workingInput.length) {
    const workingOutput = await kSemanticModels
      .utils()
      .withTxn(opts =>
        createFolderListWithTransaction(workspace, workingInput, opts)
      );
    const result = bagAddFolderOutput(workingOutput, input);
    kUtilsInjectables.promises().forget(publishAddFolderOutput(input, result));
  }
}

async function addFolderQueueCreateFolderList(input: IAddFolderQueueInput[]) {
  const inputByWorkspace = groupBy(input, next => next.workspaceId);
  await Promise.all(
    Object.entries(inputByWorkspace).map(async ([, input]) =>
      createFolderListWithWorkspace(input)
    )
  );
}

function getAddFolderQueueKey(queueNo: number) {
  assert.ok(isNumber(queueNo));
  return kFolderConstants.getAddFolderQueueWithNo(queueNo);
}

function waitOnQueue(key: string, fn: AnyFn) {
  if (!kUtilsInjectables.runtimeState().getIsEnded()) {
    kUtilsInjectables.queue().waitOnStream(key, hasData => {
      if (hasData) {
        fn();
      } else {
        setTimeout(() => {
          waitOnQueue(key, fn);
        }, 0);
      }
    });
  }
}

async function handleAddFolderQueue(inputQueueNo: number) {
  const key = getAddFolderQueueKey(inputQueueNo);
  const rawInput = await kUtilsInjectables
    .queue()
    .getMessages(
      key,
      kFolderConstants.addFolderProcessCount,
      /** remove */ true
    );

  if (rawInput.length) {
    const input = rawInput.map(
      next => next.message
    ) as unknown as IAddFolderQueueInput[];

    await addFolderQueueCreateFolderList(input);
  }

  waitOnQueue(key, () => {
    kUtilsInjectables.promises().forget(handleAddFolderQueue(inputQueueNo));
  });
}

export function startHandleAddFolderQueue(inputQueueNo: number) {
  const key = getAddFolderQueueKey(inputQueueNo);
  waitOnQueue(key, () => {
    kUtilsInjectables.promises().forget(handleAddFolderQueue(inputQueueNo));
  });
}
