import {defaultTo} from 'lodash';
import {IFolder} from '../../../definitions/folder';
import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
  ISessionAgent,
} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {ServerError} from '../../../utilities/errors';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  getFilePermissionOwners,
  makeBasePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/BaseContext';
import {getOrganizationId} from '../../contexts/SessionContext';
import {fileConstants} from '../../files/constants';
import {folderConstants} from '../constants';
import FolderQueries from '../queries';
import {
  assertSplitPathWithDetails,
  FolderUtils,
  splitPathWithDetails,
} from '../utils';
import {AddFolderEndpoint, INewFolderInput} from './types';
import {addFolderJoiSchema} from './validation';

export async function createSingleFolder(
  context: IBaseContext,
  agent: IAgent,
  organizationId: string,
  parent: IFolder | null,
  input: INewFolderInput
) {
  const {splitPath, name} = splitPathWithDetails(input.path);
  const existingFolder = await context.data.folder.getItem(
    FolderQueries.folderExistsByNamePath(organizationId, splitPath)
  );

  if (existingFolder) {
    return existingFolder;
  }

  const folderId = getNewId();
  const isPublic = defaultTo(
    input.isPublic,
    defaultTo(parent?.isPublic, false)
  );

  return await context.data.folder.saveItem({
    organizationId,
    name,
    isPublic,
    resourceId: folderId,
    parentId: parent?.resourceId,
    idPath: parent ? parent.idPath.concat(folderId) : [folderId],
    namePath: parent ? parent.namePath.concat(name) : [name],
    createdAt: getDateString(),
    createdBy: agent,
    description: input.description,
    maxFileSizeInBytes:
      input.maxFileSizeInBytes || fileConstants.maxFileSizeInBytes,
    markedPublicAt: isPublic ? getDateString() : undefined,
    markedPublicBy: isPublic ? agent : undefined,
  });
}

export async function getClosestExistingFolder(
  context: IBaseContext,
  organizationId: string,
  splitParentPath: string[]
) {
  const existingFolders = await Promise.all(
    splitParentPath.map((p, i) => {
      return context.data.folder.getItem(
        FolderQueries.getByNamePath(
          organizationId,
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
  organizationId: string,
  input: INewFolderInput
) {
  const pathWithDetails = assertSplitPathWithDetails(input.path);
  const {closestExistingFolderIndex, closestExistingFolder, existingFolders} =
    await getClosestExistingFolder(
      context,
      organizationId,
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
      await checkAuthorization(
        context,
        agent,
        organizationId,
        null,
        AppResourceType.Folder,
        previousFolder
          ? getFilePermissionOwners(organizationId, previousFolder)
          : makeBasePermissionOwnerList(organizationId),
        BasicCRUDActions.Create
      );

      hasCheckAuth = true;
    }

    // The main folder we want to create
    const isMainFolder = i === pathWithDetails.splitPath.length - 1;
    const nextInputPath = pathWithDetails.splitPath.slice(0, i + 1);
    const nextInput: INewFolderInput = {
      path: nextInputPath.join(folderConstants.nameSeparator),
      description: isMainFolder ? input.description : undefined,
      maxFileSizeInBytes: isMainFolder ? input.maxFileSizeInBytes : undefined,
    };

    previousFolder = await createSingleFolder(
      context,
      agent,
      organizationId,
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
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const folder = await createFolderList(
    context,
    agent,
    organizationId,
    data.folder
  );

  return {
    folder: FolderUtils.getPublicFolder(folder),
  };
};

export default addFolder;
