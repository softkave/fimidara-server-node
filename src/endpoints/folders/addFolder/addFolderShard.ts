import assert from 'assert';
import {first, isArray} from 'lodash-es';
import {convertToArray, indexArray} from 'softkave-js-utils';
import {
  checkAuthorizationWithAgent,
  getResourcePermissionContainers,
} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {Folder} from '../../../definitions/folder.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {Resource, SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {appAssert} from '../../../utils/assertion.js';
import {pathJoin} from '../../../utils/fns.js';
import {
  ShardedInput,
  ShardedRunnerOutputPerInput,
  ShardId,
} from '../../../utils/shardedRunnerQueue.js';
import {PermissionDeniedError} from '../../users/errors.js';
import {kFolderConstants} from '../constants.js';
import {FolderExistsError} from '../errors.js';
import {createNewFolder} from '../utils.js';
import {folderInputListToSet} from './folderInputListToSet.js';
import {getExistingFoldersAndArtifacts} from './getExistingFoldersAndArtifacts.js';
import {
  AddFolderShard,
  AddFolderShardNewFolderInput,
  AddFolderShardPerInputOutputItem,
  AddFolderShardRunner,
  kAddFolderShardRunnerPrefix,
} from './types.js';

async function checkAuth(
  agent: SessionAgent,
  workspace: Workspace,
  target: Resource,
  opts: SemanticProviderMutationParams
) {
  const checks = await checkAuthorizationWithAgent({
    agent,
    workspace,
    opts,
    workspaceId: workspace.resourceId,
    target: {
      action: kFimidaraPermissionActions.addFolder,
      targetId: getResourcePermissionContainers(
        workspace.resourceId,
        target,
        /** includeResourceId */ true
      ),
    },
    nothrow: true,
  });

  const hasAccess = checks.every(check => check.hasAccess);
  return {hasAccess, target};
}

async function createFolderListWithTransaction(
  workspace: Workspace,
  input: AddFolderShardNewFolderInput | AddFolderShardNewFolderInput[],
  inputSet: ReturnType<typeof folderInputListToSet>,
  opts: SemanticProviderMutationParams
) {
  const {addFolder, getFolder, getSelfOrClosestParent} =
    await getExistingFoldersAndArtifacts(workspace.resourceId, inputSet, opts);

  // Use a map to avoid duplicating auth checks to the same target
  const authTargetsMap = new Map<
    /** resourceId */ string,
    {resource: Resource; agent: SessionAgent}
  >();
  const possibleNewFoldersRecord: Record<
    /** stringified namepath */ string,
    {folder: Folder; authTarget: Resource | undefined} | undefined
  > = {};
  const inputList = convertToArray(input);

  inputSet.pathinfoList?.forEach((pathinfo, inputIndex) => {
    let prevFolder = getSelfOrClosestParent(pathinfo.namepath);
    const inputAtIndex = inputList[inputIndex];
    const existingDepth = prevFolder?.namepath.length ?? 0;

    // If existingDepth matches namepath length, then the folder exists
    if (
      inputAtIndex.throwOnFolderExists &&
      existingDepth === pathinfo.namepath.length &&
      inputAtIndex.isLeafFolder
    ) {
      throw new FolderExistsError();
    }

    // Create folders for folders not found starting from the closest existing
    // parent represented by existingDepth. If existingDepth ===
    // namepath.length, then folder exists, and no new folder is created
    pathinfo.namepath.slice(existingDepth).forEach((name, nameIndex) => {
      let authTarget: Resource | undefined;
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

      if (
        !inputAtIndex.UNSAFE_skipAuthCheck &&
        // If there is no parent, seeing actualNameIndex will only ever be 0 if
        // there is no prevFolder, we need to do auth check using workspace,
        // seeing that's the closest permission container
        actualNameIndex === 0
      ) {
        authTarget = workspace;
        authTargetsMap.set(authTarget.resourceId, {
          resource: authTarget,
          agent: inputAtIndex.agent,
        });
      } else if (
        !inputAtIndex.UNSAFE_skipAuthCheck &&
        // If we have a parent, and this folder is the next one right after, use
        // the parent, represented by prevFolder for auth check, seeing it's the
        // closest permission container.
        existingDepth &&
        actualNameIndex === existingDepth + 1
      ) {
        appAssert(prevFolder);
        authTarget = prevFolder;
        authTargetsMap.set(authTarget.resourceId, {
          resource: authTarget,
          agent: inputAtIndex.agent,
        });
      }

      // Set prevFolder to current folder, so the next folder can use it as
      // parent, and set it also in foldersByNamepath so other inputs can use it
      // (not sure how much useful the last part is, but just in case)
      addFolder(folder);
      prevFolder = folder;
      const fp = folder.namepath.join(kFolderConstants.separator);
      possibleNewFoldersRecord[fp] = {folder, authTarget};
    });
  });

  const possibleNewFolders = Object.values(possibleNewFoldersRecord);
  let checksRecord: Record<string, boolean> = {};

  if (possibleNewFolders.length) {
    const checkPromiseList: Array<ReturnType<typeof checkAuth>> = [];

    // No need to check auth if there are no new folders, so only check if we
    // have newFolders
    authTargetsMap.forEach(({agent, resource: target}) => {
      checkPromiseList.push(checkAuth(agent, workspace, target, opts));
    });

    checksRecord = indexArray(await Promise.all(checkPromiseList), {
      indexer: check => check.target.resourceId,
      reducer: check => check.hasAccess,
    });

    const newFolders = possibleNewFolders
      .filter(pf =>
        pf?.authTarget ? checksRecord[pf.authTarget.resourceId] : true
      )
      .map(pf => pf!.folder);
    await kSemanticModels.folder().insertItem(newFolders, opts);
  }

  function getError(p: string) {
    const pf = possibleNewFoldersRecord[p];
    const hasAccess = pf?.authTarget
      ? checksRecord[pf.authTarget.resourceId]
      : true;

    if (!hasAccess) {
      return new PermissionDeniedError();
    }

    return undefined;
  }

  function getFolderInfo(
    p: string
  ): {success: true; folder: Folder} | {success: false; error: Error} {
    const error = getError(p);
    const folder = getFolder(p);
    assert(folder);

    if (error) {
      return {success: false, error};
    } else {
      return {success: true, folder};
    }
  }

  return {
    getFolderInfo,
    pathinfoList: inputSet.pathinfoList,
  };
}

function matchAddFolderShard(id: ShardId) {
  return first(id) === kAddFolderShardRunnerPrefix;
}

type FoldersByNamepath = Record<string, Folder[] | Error>;

async function runAddFolderShard(shard: AddFolderShard) {
  const {shardInputList: input, meta} = shard;
  const folderInputList = input.map(nextInput => nextInput.input);
  const inputSet = folderInputListToSet(folderInputList);

  // TODO: because a started txn does not pick folders created by other shards,
  // we want to start txns within shard runner. Downside is folders are created
  // even if callers like uploadFile fail. A solution will be to run everything
  // related to ingesting file and folder within one shard, and by consequence,
  // one txn
  const {pathinfoList, getFolderInfo} = await kSemanticModels
    .utils()
    .withTxn(opts =>
      createFolderListWithTransaction(
        meta.workspace,
        folderInputList,
        inputSet,
        opts
      )
    );

  const foldersByInput = pathinfoList.reduce((acc, pathinfo) => {
    const folders: Folder[] = [];
    let error: Error | undefined;

    for (let index = 0; index < pathinfo.namepath.length; index++) {
      const key = pathJoin(pathinfo.namepath.slice(0, index + 1));
      const folder = getFolderInfo(key);

      if (folder.success) {
        folders.push(folder.folder);
      } else {
        error = folder.error;
        break;
      }
    }

    if (error) {
      acc[pathinfo.stringPath] = error;
    } else {
      folders.sort((f1, f2) => f1.namepath.length - f2.namepath.length);
      acc[pathinfo.stringPath] = folders;
    }

    return acc;
  }, {} as FoldersByNamepath);

  const result = input.reduce((acc, nextInput) => {
    const pathinfo = inputSet.pathinfoRecord[nextInput.input.folderpath];
    appAssert(pathinfo);
    const output = foldersByInput[pathinfo.stringPath];
    acc.set(nextInput, {
      output: isArray(output)
        ? {success: true, item: output}
        : {success: false, reason: output},
      shardInput: nextInput,
    });
    return acc;
  }, new Map<ShardedInput, ShardedRunnerOutputPerInput<AddFolderShardPerInputOutputItem>>());

  return result;
}

export const addFolderShardRunner: AddFolderShardRunner = {
  name: kAddFolderShardRunnerPrefix,
  match: matchAddFolderShard,
  runner: runAddFolderShard,
};
