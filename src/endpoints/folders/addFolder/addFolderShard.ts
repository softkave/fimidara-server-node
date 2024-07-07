import {first} from 'lodash-es';
import {convertToArray} from 'softkave-js-utils';
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
import {
  checkAuthorizationWithAgent,
  getResourcePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../contexts/semantic/types.js';
import {FolderExistsError} from '../errors.js';
import {createNewFolder} from '../utils.js';
import {
  folderInputListToSet,
  getExistingFoldersAndArtifacts,
} from './getExistingFoldersAndArtifacts.js';
import {
  AddFolderShard,
  AddFolderShardPerInputOutputItem,
  AddFolderShardRunner,
  FoldersByNamepath,
  kAddFolderShardRunnerPrefix,
  NewFolderInput,
} from './types.js';

async function createFolderListWithTransaction(
  agent: SessionAgent,
  workspace: Workspace,
  input: NewFolderInput | NewFolderInput[],
  inputSet: ReturnType<typeof folderInputListToSet>,
  UNSAFE_skipAuthCheck = false,
  throwOnFolderExists = true,
  opts: SemanticProviderMutationParams
) {
  const {pathinfoList, addFolder, getFolder, getSelfOrClosestParent} =
    await getExistingFoldersAndArtifacts(workspace.resourceId, inputSet, opts);
  const newFolders: Folder[] = [];
  // Use a set to avoid duplicating auth checks to the same target
  const checkAuthTargets: Set<Resource> = new Set();

  const inputMap = convertToArray(input).reduce(
    (acc, nextInput) => {
      acc[nextInput.folderpath] = nextInput;
      return acc;
    },
    {} as Record<string, NewFolderInput>
  );
  const inputList = Object.values(inputMap);

  pathinfoList?.forEach((pathinfo, pathinfoIndex) => {
    const inputForIndex = inputList[pathinfoIndex] as
      | NewFolderInput
      | undefined;
    let prevFolder = getSelfOrClosestParent(pathinfo.namepath);
    const existingDepth = prevFolder?.namepath.length ?? 0;

    // If existingDepth matches namepath length, then the folder exists
    if (throwOnFolderExists && existingDepth === pathinfo.namepath.length) {
      throw new FolderExistsError();
    }

    // Create folders for folders not found starting from the closest existing
    // parent represented by existingDepth. If existingDepth ===
    // namepath.length, then folder exists, and no new folder is created
    pathinfo.namepath.slice(existingDepth).forEach((name, nameIndex) => {
      const actualNameIndex = nameIndex + existingDepth;
      const folder: Folder = createNewFolder(
        agent,
        workspace.resourceId,
        /** pathinfo */ {name},
        prevFolder,
        /** input */ {
          // description belongs to only the actual folder from input
          description:
            actualNameIndex === pathinfo.namepath.length - 1
              ? inputForIndex?.description
              : undefined,
        }
      );

      if (
        !UNSAFE_skipAuthCheck &&
        // If there is no parent, seeing actualNameIndex will only ever be 0 if
        // there is no prevFolder, we need to do auth check using workspace,
        // seeing that's the closest permission container
        actualNameIndex === 0
      ) {
        checkAuthTargets.add(workspace);
      } else if (
        !UNSAFE_skipAuthCheck &&
        // If we have a parent, and this folder is the next one right after, use
        // the parent, represented by prevFolder for auth check, seeing it's the
        // closest permission container.
        existingDepth &&
        actualNameIndex === existingDepth + 1
      ) {
        appAssert(prevFolder);
        checkAuthTargets.add(prevFolder);
      }

      // Set prevFolder to current folder, so the next folder can use it as
      // parent, and set it also in foldersByNamepath so other inputs can use it
      // (not sure how much useful the last part is, but just in case)
      addFolder(folder);
      prevFolder = folder;
      newFolders.push(folder);
    });
  });

  if (newFolders.length) {
    const checkAuthPromises: Array<Promise<unknown>> = [];
    const saveFilesPromise = kSemanticModels
      .folder()
      .insertItem(newFolders, opts);

    // No need to check auth if there are no new folders, so only check if we
    // have newFolders
    checkAuthTargets.forEach(target => {
      checkAuthPromises.push(
        checkAuthorizationWithAgent({
          agent,
          workspace,
          opts,
          workspaceId: workspace.resourceId,
          target: {
            action: kFimidaraPermissionActions.addFolder,
            targetId: getResourcePermissionContainers(
              workspace.resourceId,
              target,
              /** include target ID in containers */ true
            ),
          },
        })
      );
    });

    await Promise.all([Promise.all(checkAuthPromises), saveFilesPromise]);
  }

  return {
    getFolder,
    pathinfoList,
  };
}

function matchAddFolderShard(id: ShardId) {
  return first(id) === kAddFolderShardRunnerPrefix;
}

async function runAddFolderShard(shard: AddFolderShard) {
  const {shardInputList: input, meta} = shard;
  const folderInputList = input.map(nextInput => nextInput.input);
  const inputSet = folderInputListToSet(folderInputList);

  // TODO: because a started txn does not pick folders created by other shards,
  // we want to start txns within shard runner. Downside is folders are created
  // even if callers like uploadFile fail. A solution will be to run everything
  // related to ingesting file and folder within one shard, and by consequence,
  // one txn
  const {pathinfoList, getFolder} = await kSemanticModels
    .utils()
    .withTxn(opts =>
      createFolderListWithTransaction(
        meta.agent,
        meta.workspace,
        folderInputList,
        inputSet,
        meta.UNSAFE_skipAuthCheck,
        meta.throwOnFolderExists,
        opts
      )
    );

  const foldersByInput = pathinfoList.reduce((acc, pathinfo) => {
    const folders: Folder[] = (acc[pathinfo.stringPath] = []);
    pathinfo.namepath.forEach((name, index) => {
      const key = pathJoin(pathinfo.namepath.slice(0, index + 1));
      const folder = getFolder(key);
      appAssert(folder);
      folders.push(folder);
    });

    folders.sort((f1, f2) => f1.namepath.length - f2.namepath.length);
    return acc;
  }, {} as FoldersByNamepath);

  const result = input.reduce((acc, nextInput) => {
    const pathinfo =
      inputSet.pathinfoWithRootnameMap[nextInput.input.folderpath];
    appAssert(pathinfo);
    const output = foldersByInput[pathinfo.stringPath];
    acc.set(nextInput, {output, shardInput: nextInput});

    return acc;
  }, new Map<ShardedInput, ShardedRunnerOutputPerInput<AddFolderShardPerInputOutputItem>>());

  return result;
}

export const addFolderShardRunner: AddFolderShardRunner = {
  name: kAddFolderShardRunnerPrefix,
  match: matchAddFolderShard,
  runner: runAddFolderShard,
};
