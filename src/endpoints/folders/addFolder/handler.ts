import {merge, omit} from 'lodash';
import {IFolder} from '../../../definitions/folder';
import {IWorkspace} from '../../../definitions/workspace';
import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
  IPublicAccessOp,
  ISessionAgent,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {compactPublicAccessOps} from '../../../definitions/utils';
import {getDate, getDateString} from '../../../utilities/dateFns';
import {ServerError} from '../../../utilities/errors';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  getFilePermissionOwners,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/BaseContext';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {fileConstants} from '../../files/constants';
import {replacePublicPresetAccessOpsByPermissionOwner} from '../../permissionItems/utils';
import EndpointReusableQueries from '../../queries';
import {folderConstants} from '../constants';
import FolderQueries from '../queries';
import {
  assertSplitPathWithDetails,
  folderExtractor,
  splitPathWithDetails,
} from '../utils';
import {AddFolderEndpoint, INewFolderInput} from './types';
import {addFolderJoiSchema} from './validation';

export async function createSingleFolder(
  context: IBaseContext,
  agent: IAgent,
  workspace: IWorkspace,
  parent: IFolder | null,
  input: INewFolderInput
) {
  const {splitPath, name} = splitPathWithDetails(input.folderpath);
  const existingFolder = await context.data.folder.getItem(
    FolderQueries.folderExistsByNamePath(workspace.resourceId, splitPath)
  );

  if (existingFolder) {
    return existingFolder;
  }

  const folderId = getNewId();
  const savedFolder = await context.data.folder.saveItem({
    name,
    workspaceId: workspace.resourceId,
    resourceId: folderId,
    parentId: parent?.resourceId,
    idPath: parent ? parent.idPath.concat(folderId) : [folderId],
    namePath: parent ? parent.namePath.concat(name) : [name],
    createdAt: getDateString(),
    createdBy: agent,
    description: input.description,
    maxFileSizeInBytes:
      input.maxFileSizeInBytes || fileConstants.maxFileSizeInBytes,
  });

  let publicAccessOps: IPublicAccessOp[] = input.publicAccessOps
    ? input.publicAccessOps.map(op => ({
        ...op,
        markedAt: getDate(),
        markedBy: agent,
      }))
    : [];

  publicAccessOps = compactPublicAccessOps(publicAccessOps);
  await replacePublicPresetAccessOpsByPermissionOwner(
    context,
    agent,
    workspace,
    savedFolder.resourceId,
    AppResourceType.Folder,
    publicAccessOps
  );

  return savedFolder;
}

export async function getClosestExistingFolder(
  context: IBaseContext,
  workspaceId: string,
  splitParentPath: string[]
) {
  const existingFolders = await Promise.all(
    splitParentPath.map((p, i) => {
      return context.data.folder.getItem(
        FolderQueries.getByNamePath(
          workspaceId,
          splitParentPath.slice(0, i + 1)
        )
      );
    })
  );

  const firstNullItemIndex = existingFolders.findIndex(folder => !folder);
  const closestExistingFolderIndex =
    firstNullItemIndex === -1
      ? existingFolders.length - 1
      : firstNullItemIndex - 1;

  const closestExistingFolder = existingFolders[closestExistingFolderIndex];
  return {closestExistingFolder, closestExistingFolderIndex, existingFolders};
}

export async function createFolderList(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  input: INewFolderInput
) {
  const pathWithDetails = assertSplitPathWithDetails(input.folderpath);
  const {closestExistingFolderIndex, closestExistingFolder, existingFolders} =
    await getClosestExistingFolder(
      context,
      workspace.resourceId,
      pathWithDetails.splitPath
    );

  let previousFolder = closestExistingFolder;
  let hasCheckAuth = false;

  // TODO: create folders in a transaction and revert if there's an error
  for (
    let i = closestExistingFolderIndex + 1;
    i < pathWithDetails.splitPath.length;
    i++
  ) {
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
        permissionOwners: previousFolder
          ? getFilePermissionOwners(
              workspace.resourceId,
              previousFolder,
              AppResourceType.Folder
            )
          : makeWorkspacePermissionOwnerList(workspace.resourceId),
        action: BasicCRUDActions.Create,
      });

      hasCheckAuth = true;
    }

    // The main folder we want to create
    const isMainFolder = i === pathWithDetails.splitPath.length - 1;
    const nextInputPath = pathWithDetails.splitPath.slice(0, i + 1);
    const nextInput: INewFolderInput = {
      folderpath: nextInputPath.join(folderConstants.nameSeparator),
    };

    if (isMainFolder) {
      merge(nextInput, omit(input, 'path', 'tags'));
    }

    previousFolder = await createSingleFolder(
      context,
      agent,
      workspace,
      previousFolder,
      nextInput
    );
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
  const agent = await context.session.getAgent(
    context,
    instData,
    publicPermissibleEndpointAgents
  );

  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await context.data.workspace.assertGetItem(
    EndpointReusableQueries.getById(workspaceId)
  );

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

  folder = await withAssignedPresetsAndTags(
    context,
    folder.workspaceId,
    folder,
    AppResourceType.Folder
  );

  return {
    folder: folderExtractor(folder),
  };
};

export default addFolder;
