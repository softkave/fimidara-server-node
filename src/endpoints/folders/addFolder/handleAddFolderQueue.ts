import assert from 'assert';
import {groupBy, isNumber} from 'lodash-es';
import {pathJoin} from 'softkave-js-utils';
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
import {appAssert} from '../../../utils/assertion.js';
import {kAppMessages} from '../../../utils/messages.js';
import {NotFoundError} from '../../errors.js';
import {PermissionDeniedError} from '../../users/errors.js';
import {kFolderConstants} from '../constants.js';
import {createNewFolder, getFolderpathInfo} from '../utils.js';
import {getExistingFoldersAndArtifacts} from './getExistingFoldersAndArtifacts.js';
import {prepareFolderInputList} from './prepareFolderInputList.js';
import {
  IAddFolderQueueInput,
  IAddFolderQueueOutput,
  IAddFolderQueueWorkingInput,
  kAddFolderQueueOutputType,
} from './types.js';

interface IAuthTarget {
  target: Resource;
  agent: SessionAgent;
  folderpath: string;
}

interface IPossibleNewFolder {
  folder: Folder;
  authTarget: Resource;
  agents: SessionAgent[];
}

type OutputByNamepath = Record<
  string,
  {isSuccess: true; folders: Folder[]} | {isSuccess: false; error: unknown}
>;

async function checkAuthOnTarget(
  workspace: Workspace,
  target: IAuthTarget,
  opts: SemanticProviderMutationParams
) {
  const checks = await checkAuthorizationWithAgent({
    workspace,
    opts,
    agent: target.agent,
    workspaceId: workspace.resourceId,
    target: {
      action: kFimidaraPermissionActions.addFolder,
      targetId: getResourcePermissionContainers(
        workspace.resourceId,
        target.target,
        /** includeResourceId */ true
      ),
    },
    nothrow: true,
  });

  const hasAccess = checks.every(check => check.hasAccess);
  return {hasAccess, ...target};
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

  // Use a map to avoid duplicating auth checks to the same target
  const authTargetsList: IAuthTarget[] = [];
  const pNFRecord: Record<
    /** stringified namepath */ string,
    IPossibleNewFolder | undefined
  > = {};

  preppedInput.pathinfoList?.forEach((pathinfo, inputIndex) => {
    let prevFolder = getSelfOrClosestParent(pathinfo.namepath);
    const inputAtIndex = inputList[inputIndex];
    const existingDepth = prevFolder?.namepath.length ?? 0;
    let authTarget: Resource | undefined;

    // Create folders for folders not found starting from the closest existing
    // parent represented by existingDepth. If existingDepth ===
    // namepath.length, then folder exists, and no new folder is created
    const newNamepath = pathinfo.namepath.slice(existingDepth);

    if (newNamepath.length) {
      newNamepath.forEach((name, nameIndex) => {
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
        const fp = folder.namepath.join(kFolderConstants.separator);

        if (
          // If there is no parent, seeing actualNameIndex will only ever be 0 if
          // there is no prevFolder, we need to do auth check using workspace,
          // seeing that's the closest permission container
          actualNameIndex === 0
        ) {
          authTarget = workspace;
          authTargetsList.push({
            target: authTarget,
            agent: inputAtIndex.agent,
            folderpath: pathinfo.stringPath,
          });
        } else if (
          // If we have a parent, and this folder is the next one right after, use
          // the parent, represented by prevFolder for auth check, seeing it's the
          // closest permission container.
          existingDepth &&
          actualNameIndex === existingDepth + 1
        ) {
          appAssert(prevFolder);
          authTarget = prevFolder;
          authTargetsList.push({
            target: authTarget,
            agent: inputAtIndex.agent,
            folderpath: pathinfo.stringPath,
          });
        }

        assert.ok(authTarget);
        pNFRecord[fp] = {folder, authTarget, agents: [inputAtIndex.agent]};
      });
    } else {
      assert.ok(prevFolder);
      const fp = prevFolder.namepath.join(kFolderConstants.separator);
      const pNF = pNFRecord[fp];
      assert.ok(pNF);
      pNF.agents.push(inputAtIndex.agent);
      authTargetsList.push({
        target: pNF.authTarget,
        agent: inputAtIndex.agent,
        folderpath: pathinfo.stringPath,
      });
    }
  });

  const pNFList = Object.values(pNFRecord) as IPossibleNewFolder[];
  const authPList = await Promise.all(
    authTargetsList.map(target => checkAuthOnTarget(workspace, target, opts))
  );

  const authChecksByFolderRecords: Record<string, boolean | undefined> = {};
  const authChecksByAgent: Record<
    string,
    {hasAccess: boolean; folderpath: string}[] | undefined
  > = {};

  authPList.forEach(({hasAccess, target, agent, folderpath}) => {
    authChecksByFolderRecords[target.resourceId] = hasAccess;
    authChecksByAgent[agent.agentId] = [
      ...(authChecksByAgent[agent.agentId] ?? []),
      {hasAccess, folderpath},
    ];
  });

  const newFolderList = pNFList
    .filter(pNF => authChecksByFolderRecords[pNF.authTarget.resourceId])
    .map(pNF => pNF!.folder);
  await kSemanticModels.folder().insertItem(newFolderList, opts);

  function getError(folderpath: string, agentId: string) {
    const access = (authChecksByAgent[agentId] ?? []).find(
      next => next.folderpath === folderpath
    );

    if (access && !access.hasAccess) {
      return new PermissionDeniedError();
    }

    return;
  }

  function getFolderInfo(
    folderpath: string,
    agentId: string
  ): {success: true; folder: Folder} | {success: false; error: Error} {
    const error = getError(folderpath, agentId);
    const folder = getFolder(folderpath);
    assert(folder);

    if (error) {
      return {success: false, error};
    } else {
      return {success: true, folder};
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
  return pathinfoList.reduce((acc, pathinfo) => {
    const folders: Folder[] = [];
    let error: Error | undefined;

    for (let index = 0; index < pathinfo.namepath.length; index++) {
      const key = pathJoin({input: pathinfo.namepath.slice(0, index + 1)});
      const inputAtIndex = input[index];
      assert.ok(inputAtIndex);
      assert.ok(inputAtIndex.folderpath === pathinfo.input);

      const folder = getFolderInfo(key, inputAtIndex.agentId);
      if (folder.success) {
        folders.push(folder.folder);
      } else {
        error = folder.error;
        break;
      }
    }

    if (error) {
      acc[pathinfo.stringPath] = {isSuccess: false, error};
    } else {
      folders.sort((f1, f2) => f1.namepath.length - f2.namepath.length);
      acc[pathinfo.stringPath] = {isSuccess: true, folders};
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
      const pathinfo = getFolderpathInfo(input.folderpath, {
        containsRootname: true,
        allowRootFolder: false,
      });
      appAssert(pathinfo);

      const inputResult = result[pathinfo.stringPath];
      const output: IAddFolderQueueOutput = inputResult.isSuccess
        ? {
            folders: inputResult.folders,
            type: kAddFolderQueueOutputType.success,
            id: input.id,
          }
        : {
            error: inputResult.error,
            type: kAddFolderQueueOutputType.error,
            id: input.id,
          };

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
      acc[nextInput.folderpath] = {isSuccess: false, error};
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
      acc[nextInput.input!.folderpath] = {
        isSuccess: false,
        error: nextInput.error,
      };
      return acc;
    }, {} as OutputByNamepath);

    kUtilsInjectables.promises().forget(publishAddFolderOutput(input, result));
  }

  const workingOutput = await kSemanticModels
    .utils()
    .withTxn(opts =>
      createFolderListWithTransaction(workspace, workingInput, opts)
    );
  const result = bagAddFolderOutput(workingOutput, input);
  kUtilsInjectables.promises().forget(publishAddFolderOutput(input, result));
}

async function addFolderQueueCreateFolderList(input: IAddFolderQueueInput[]) {
  const inputByWorkspace = groupBy(input, next => next.workspaceId);
  await Promise.all(
    Object.entries(inputByWorkspace).map(async ([, input]) =>
      createFolderListWithWorkspace(input)
    )
  );
}

function getAddFolderQueueKey() {
  const queueNo = kUtilsInjectables.suppliedConfig().addFolderQueueNo;
  assert.ok(isNumber(queueNo));

  return kFolderConstants.getAddFolderQueueWithNo(queueNo);
}

function waitOnQueue(key: string) {
  if (!kUtilsInjectables.runtimeState().getIsEnded()) {
    kUtilsInjectables.queue().waitOnStream(key, handleAddFolderQueue);
  }
}

export async function handleAddFolderQueue() {
  const key = getAddFolderQueueKey();
  const input = await kUtilsInjectables
    .queue()
    .getMessages<IAddFolderQueueInput>(
      key,
      kFolderConstants.addFolderProcessCount,
      /** remove */ true
    );

  if (input.length === 0) {
    waitOnQueue(key);
    return;
  }

  await addFolderQueueCreateFolderList(input);

  if (!kUtilsInjectables.runtimeState().getIsEnded()) {
    kUtilsInjectables.promises().forget(handleAddFolderQueue());
  }
}

export async function createAddFolderQueue() {
  assert.ok(
    kUtilsInjectables.suppliedConfig().addFolderQueueKey,
    'No addFolderQueueKey in suppliedConfig'
  );

  const key = getAddFolderQueueKey();
  await kUtilsInjectables.queue().createQueue(key);
}
