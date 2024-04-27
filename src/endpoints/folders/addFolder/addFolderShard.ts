import {first} from 'lodash';
import {Folder} from '../../../definitions/folder';
import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {Resource, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {pathJoin} from '../../../utils/fns';
import {ShardId} from '../../../utils/shardedRunnerQueue';
import {
  checkAuthorizationWithAgent,
  getResourcePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {SemanticProviderMutationParams} from '../../contexts/semantic/types';
import {FolderExistsError} from '../errors';
import {createNewFolder} from '../utils';
import {getExistingFoldersAndArtifacts} from './getExistingFoldersAndArtifacts';
import {
  AddFolderShard,
  AddFolderShardRunner,
  NewFolderInput,
  kAddFolderShardPart,
} from './types';

async function createFolderListWithTransaction(
  agent: SessionAgent,
  workspace: Workspace,
  input: NewFolderInput | NewFolderInput[],
  UNSAFE_skipAuthCheck = false,
  throwOnFolderExists = true,
  opts: SemanticProviderMutationParams
) {
  const {
    pathinfoList,
    foldersByNamepath,
    existingFolders,
    inputList,
    getSelfOrClosestParent,
  } = await getExistingFoldersAndArtifacts(workspace.resourceId, input, opts);
  const newFolders: Folder[] = [];
  // Use a set to avoid duplicating auth checks to the same target
  const checkAuthTargets: Set<Resource> = new Set();

  pathinfoList?.forEach((pathinfo, pathinfoIndex) => {
    const inputForIndex = inputList[pathinfoIndex];
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
              ? inputForIndex.description
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
      foldersByNamepath[pathJoin(folder.namepath).toLowerCase()] = folder;
      prevFolder = folder;
      newFolders.push(folder);
    });
  });

  if (newFolders.length) {
    const checkAuthPromises: Array<Promise<unknown>> = [];
    const saveFilesPromise = kSemanticModels.folder().insertItem(newFolders, opts);

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
            action: kFimidaraPermissionActionsMap.addFolder,
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

  return {newFolders, existingFolders};
}

function matchAddFolderShard(id: ShardId) {
  return first(id) === kAddFolderShardPart;
}

async function runAddFolderShard(shard: AddFolderShard) {
  const {input, meta} = shard;
  return await kSemanticModels
    .utils()
    .withTxn(
      opts =>
        createFolderListWithTransaction(
          meta.agent,
          meta.workspace,
          input,
          meta.UNSAFE_skipAuthCheck,
          meta.throwOnFolderExists,
          opts
        ),
      /** reuse txn */ false,
      meta.opts
    );
}

export const addFolderShardRunner: AddFolderShardRunner = {
  match: matchAddFolderShard,
  runner: runAddFolderShard,
  name: kAddFolderShardPart,
};
