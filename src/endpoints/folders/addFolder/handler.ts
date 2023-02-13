import {merge} from 'lodash';
import {IFolder} from '../../../definitions/folder';
import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
  IPublicAccessOp,
  ISessionAgent,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {compactPublicAccessOps} from '../../../definitions/utils';
import {IWorkspace} from '../../../definitions/workspace';
import {getDate, getDateString} from '../../../utils/dateFns';
import {ServerError} from '../../../utils/errors';
import {getNewIdForResource} from '../../../utils/resourceId';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  getFilePermissionContainers,
  makeWorkspacePermissionContainerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import {replacePublicPermissionGroupAccessOps} from '../../permissionItems/utils';
import WorkspaceQueries from '../../workspaces/queries';
import {assertWorkspace} from '../../workspaces/utils';
import {folderConstants} from '../constants';
import FolderQueries from '../queries';
import {addRootnameToPath, folderExtractor, splitPathWithDetails} from '../utils';
import {AddFolderEndpoint, INewFolderInput} from './types';
import {addFolderJoiSchema} from './validation';

export async function createSingleFolder(
  context: IBaseContext,
  agent: IAgent,
  workspace: IWorkspace,
  parent: IFolder | null,
  input: INewFolderInput
) {
  const {itemSplitPath: splitPath, name} = splitPathWithDetails(input.folderpath);
  const existingFolder = await context.data.folder.getOneByQuery(
    FolderQueries.folderExistsByNamePath(workspace.resourceId, splitPath)
  );

  if (existingFolder) {
    return existingFolder;
  }

  const folderId = getNewIdForResource(AppResourceType.Folder);
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: agent.agentId,
    agentType: agent.agentType,
  };

  const savedFolder = await context.data.folder.insertItem({
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    name,
    workspaceId: workspace.resourceId,
    resourceId: folderId,
    parentId: parent?.resourceId,
    idPath: parent ? parent.idPath.concat(folderId) : [folderId],
    namePath: parent ? parent.namePath.concat(name) : [name],
    description: input.description,
  });

  let publicAccessOps: IPublicAccessOp[] = input.publicAccessOps
    ? input.publicAccessOps.map(op => ({
        ...op,
        markedAt: getDate(),
        markedBy: agent,
      }))
    : [];

  publicAccessOps = compactPublicAccessOps(publicAccessOps);
  await replacePublicPermissionGroupAccessOps(context, agent, workspace, publicAccessOps, savedFolder);
  return savedFolder;
}

export async function getClosestExistingFolder(context: IBaseContext, workspaceId: string, splitParentPath: string[]) {
  const existingFolders = await Promise.all(
    splitParentPath.map((p, i) => {
      return context.data.folder.getOneByQuery(
        FolderQueries.getByNamePath(workspaceId, splitParentPath.slice(0, i + 1))
      );
    })
  );

  const firstNullItemIndex = existingFolders.findIndex(folder => !folder);
  const closestExistingFolderIndex = firstNullItemIndex === -1 ? existingFolders.length - 1 : firstNullItemIndex - 1;
  const closestExistingFolder = existingFolders[closestExistingFolderIndex];
  return {closestExistingFolder, closestExistingFolderIndex, existingFolders};
}

export async function createFolderList(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  input: INewFolderInput
) {
  const pathWithDetails = splitPathWithDetails(input.folderpath);
  const {closestExistingFolderIndex, closestExistingFolder, existingFolders} = await getClosestExistingFolder(
    context,
    workspace.resourceId,
    pathWithDetails.itemSplitPath
  );

  let previousFolder = closestExistingFolder;
  let hasCheckAuth = false;

  // TODO: create folders in a transaction and revert if there's an error
  for (let i = closestExistingFolderIndex + 1; i < pathWithDetails.itemSplitPath.length; i++) {
    if (existingFolders[i]) {
      previousFolder = existingFolders[i];
      continue;
    }
    if (!hasCheckAuth) {
      // Check if the agent can perform operation
      await checkAuthorization({
        context,
        agent,
        workspace,
        type: AppResourceType.Folder,
        permissionContainers: previousFolder
          ? getFilePermissionContainers(workspace.resourceId, previousFolder, AppResourceType.Folder)
          : makeWorkspacePermissionContainerList(workspace.resourceId),
        action: BasicCRUDActions.Create,
      });

      hasCheckAuth = true;
    }

    // The main folder we want to create
    const isMainFolder = i === pathWithDetails.itemSplitPath.length - 1;
    const nextInputPath = pathWithDetails.itemSplitPath.slice(0, i + 1);
    const nextInput: INewFolderInput = {
      folderpath: addRootnameToPath(nextInputPath.join(folderConstants.nameSeparator), workspace.rootname),
    };

    if (isMainFolder) {
      merge(nextInput, input);
    }

    previousFolder = await createSingleFolder(context, agent, workspace, previousFolder, nextInput);
  }

  if (!previousFolder) {
    // TODO: better error message
    throw new ServerError('Error creating folder');
  }

  return previousFolder;
}

// TODO: Currently doesn't throw error if the folder already exists, do we want to change that behavior?
const addFolder: AddFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, addFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData, publicPermissibleEndpointAgents);
  const pathWithDetails = splitPathWithDetails(data.folder.folderpath);
  const workspace = await context.data.workspace.getOneByQuery(
    WorkspaceQueries.getByRootname(pathWithDetails.workspaceRootname)
  );
  assertWorkspace(workspace);
  let folder = await createFolderList(context, agent, workspace, data.folder);
  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    folder.resourceId,
    AppResourceType.Folder,
    data.folder,
    false
  );

  folder = await populateAssignedPermissionGroupsAndTags(context, folder.workspaceId, folder, AppResourceType.Folder);
  return {
    folder: folderExtractor(folder),
  };
};

export default addFolder;
