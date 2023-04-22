import {last} from 'lodash';
import {Folder} from '../../../definitions/folder';
import {
  AppActionType,
  AppResourceType,
  PERMISSION_AGENT_TYPES,
  SessionAgent,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {newWorkspaceResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  getFilePermissionContainers,
  getWorkspacePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {MemStore} from '../../contexts/mem/Mem';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {assertWorkspace} from '../../workspaces/utils';
import {folderExtractor, splitPathWithDetails} from '../utils';
import {AddFolderEndpoint, NewFolderInput} from './types';
import {addFolderJoiSchema} from './validation';

export async function getClosestExistingFolder(
  context: BaseContextType,
  workspaceId: string,
  splitParentPath: string[],
  opts?: SemanticDataAccessProviderRunOptions
) {
  const existingFolders = await Promise.all(
    splitParentPath.map((p, i) => {
      return context.semantic.folder.getOneByNamePath(
        workspaceId,
        splitParentPath.slice(0, i + 1),
        opts
      );
    })
  );

  const firstNullItemIndex = existingFolders.findIndex(folder => !folder);
  const closestExistingFolderIndex =
    firstNullItemIndex === -1 ? existingFolders.length - 1 : firstNullItemIndex - 1;
  const closestExistingFolder = existingFolders[closestExistingFolderIndex];
  return {closestExistingFolder, closestExistingFolderIndex, existingFolders};
}

export async function createFolderList(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  input: NewFolderInput,
  opts: SemanticDataAccessProviderMutationRunOptions,
  UNSAFE_skipAuthCheck = false
) {
  const pathWithDetails = splitPathWithDetails(input.folderpath);
  const {closestExistingFolderIndex, closestExistingFolder, existingFolders} =
    await getClosestExistingFolder(
      context,
      workspace.resourceId,
      pathWithDetails.itemSplitPath,
      opts
    );

  if (!UNSAFE_skipAuthCheck) {
    await checkAuthorization({
      context,
      agent,
      workspace,
      workspaceId: workspace.resourceId,
      containerId: closestExistingFolder
        ? getFilePermissionContainers(workspace.resourceId, closestExistingFolder)
        : getWorkspacePermissionContainers(workspace.resourceId),
      targets: {targetType: AppResourceType.Folder},
      action: AppActionType.Create,
    });
  }

  let previousFolder = closestExistingFolder;
  const newFolders: Folder[] = [];

  for (let i = closestExistingFolderIndex + 1; i < pathWithDetails.itemSplitPath.length; i++) {
    if (existingFolders[i]) {
      previousFolder = existingFolders[i];
      continue;
    }

    // The main folder we want to create
    const isMainFolder = i === pathWithDetails.itemSplitPath.length - 1;
    const name = pathWithDetails.itemSplitPath[i];
    const folderId = getNewIdForResource(AppResourceType.Folder);
    const folder: Folder = newWorkspaceResource(
      agent,
      AppResourceType.Folder,
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

  if (newFolders.length) {
    const mainFolder = last(newFolders);
    appAssert(mainFolder, new ServerError('Error creating folder.'));
  }

  return previousFolder;
}

// TODO: Currently doesn't throw error if the folder already exists, do we want to change that behavior?
const addFolder: AddFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, addFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const pathWithDetails = splitPathWithDetails(data.folder.folderpath);
  const workspace = await context.semantic.workspace.getByRootname(
    pathWithDetails.workspaceRootname
  );
  assertWorkspace(workspace);
  let folder = await MemStore.withTransaction(context, async txn => {
    return createFolderList(context, agent, workspace, data.folder, {transaction: txn});
  });
  appAssert(folder, new ServerError('Error creating folder.'));
  folder = await populateAssignedTags(context, folder.workspaceId, folder);
  return {folder: folderExtractor(folder)};
};

export default addFolder;
