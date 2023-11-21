import {last} from 'lodash';
import {Folder} from '../../../definitions/folder';
import {
  AppResourceTypeMap,
  PERMISSION_AGENT_TYPES,
  SessionAgent,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {getNewIdForResource, newWorkspaceResource} from '../../../utils/resource';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorizationWithAgent,
  getFilePermissionContainers,
  getWorkspacePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {FolderQuery} from '../../contexts/data/types';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {assertWorkspace} from '../../workspaces/utils';
import {FolderExistsError} from '../errors';
import {folderExtractor, getFolderpathInfo} from '../utils';
import {AddFolderEndpoint, NewFolderInput} from './types';
import {addFolderJoiSchema} from './validation';

export async function createFolderListWithTransaction(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  input: NewFolderInput,
  UNSAFE_skipAuthCheck = false,
  throwOnFolderExists = true,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const pathWithDetails = getFolderpathInfo(input.folderpath);
  let closestExistingFolder: Folder | null = null;
  let previousFolder: Folder | null = null;
  const folderQueries = pathWithDetails.itemSplitPath
    .map((p, i) => pathWithDetails.itemSplitPath.slice(0, i + 1))
    .map(
      (nextNamePath): FolderQuery => ({
        workspaceId: workspace.resourceId,
        namePath: {$all: nextNamePath, $size: nextNamePath.length},
      })
    );
  const existingFolders = await context.semantic.folder.getManyByQueryList(
    folderQueries,
    opts
  );
  existingFolders.sort((f1, f2) => f1.namePath.length - f2.namePath.length);

  if (
    existingFolders.length >= pathWithDetails.itemSplitPath.length &&
    throwOnFolderExists
  ) {
    throw new FolderExistsError();
  }

  closestExistingFolder = last(existingFolders) ?? null;
  previousFolder = closestExistingFolder ?? null;
  const newFolders: Folder[] = [];

  for (let i = existingFolders.length; i < pathWithDetails.itemSplitPath.length; i++) {
    if (existingFolders[i]) {
      previousFolder = existingFolders[i];
      continue;
    }

    // The main folder we want to create
    const isMainFolder = i === pathWithDetails.itemSplitPath.length - 1;
    const name = pathWithDetails.itemSplitPath[i];
    const folderId = getNewIdForResource(AppResourceTypeMap.Folder);
    const folder: Folder = newWorkspaceResource(
      agent,
      AppResourceTypeMap.Folder,
      workspace.resourceId,
      {
        name,
        workspaceId: workspace.resourceId,
        resourceId: folderId,
        parentId: previousFolder?.resourceId ?? null,
        idPath: previousFolder ? previousFolder.idPath.concat(folderId) : [folderId],
        namePath: previousFolder ? previousFolder.namePath.concat(name) : [name],
        description: isMainFolder ? input.description : undefined,
      }
    );

    previousFolder = folder;
    newFolders.push(folder);
  }

  if (!UNSAFE_skipAuthCheck && newFolders.length) {
    const cExistingFolder = closestExistingFolder as Folder | null;

    // It's okay to check permission after, cause if it fails, it fails the
    // transaction, which reverts the changes.
    await checkAuthorizationWithAgent({
      context,
      agent,
      workspace,
      opts,
      workspaceId: workspace.resourceId,
      target: {
        action: 'addFolder',
        targetId: cExistingFolder
          ? getFilePermissionContainers(workspace.resourceId, cExistingFolder, true)
          : getWorkspacePermissionContainers(workspace.resourceId),
      },
    });
  }

  if (newFolders.length) {
    await context.semantic.folder.insertItem(newFolders, opts);
  }

  if (!previousFolder) {
    previousFolder = last(newFolders) ?? null;
  }

  return previousFolder;
}

export async function createFolderList(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  input: NewFolderInput,
  UNSAFE_skipAuthCheck = false,
  throwOnFolderExists = true,
  opts?: SemanticDataAccessProviderMutationRunOptions
) {
  return await context.semantic.utils.withTxn(
    context,
    async opts => {
      return await createFolderListWithTransaction(
        context,
        agent,
        workspace,
        input,
        UNSAFE_skipAuthCheck,
        throwOnFolderExists,
        opts
      );
    },
    opts
  );
}

// TODO: Currently doesn't throw error if the folder already exists, do we want to change that behavior?
const addFolder: AddFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, addFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const pathWithDetails = getFolderpathInfo(data.folder.folderpath);
  const workspace = await context.semantic.workspace.getByRootname(
    pathWithDetails.workspaceRootname
  );
  assertWorkspace(workspace);
  let folder = await createFolderList(context, agent, workspace, data.folder);
  appAssert(folder, new ServerError('Error creating folder.'));
  folder = await populateAssignedTags(context, folder.workspaceId, folder);
  return {folder: folderExtractor(folder)};
};

export default addFolder;
