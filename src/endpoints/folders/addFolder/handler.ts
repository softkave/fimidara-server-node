import {IFolder} from '../../../definitions/folder';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {ServerError} from '../../../utilities/errors';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
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

async function createNextFolder(
  context: IBaseContext,
  agent: ISessionAgent,
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
  return await context.data.folder.saveItem({
    organizationId,
    folderId,
    name,
    parentId: parent?.folderId,
    idPath: parent ? parent.idPath.concat(folderId) : [folderId],
    namePath: parent ? parent.namePath.concat(name) : [name],
    createdAt: getDateString(),
    createdBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
    description: input.description,
    maxFileSize: input.maxFileSize || fileConstants.maxFileSize,
  });
}

export async function checkIfAgentCanCreateFolder(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  splitParentPath: string[]
) {
  // Make a list of folder paths
  const parentPaths: Array<string[]> = [];
  splitParentPath.forEach((item, i) => {
    i === 0
      ? parentPaths.push([item])
      : parentPaths.push(parentPaths[i - 1].concat(item));
  });

  // Find closest existing folder
  let closestExistingFolder: IFolder | null = null;
  const existingFolders = await Promise.all(
    parentPaths.map(item =>
      context.data.folder.getItem(
        FolderQueries.getByNamePath(organizationId, item)
      )
    )
  );

  for (let i = 0; i < existingFolders.length; i++) {
    const item = existingFolders[i];
    if (item === null) {
      break;
    }

    closestExistingFolder = item;
  }

  if (closestExistingFolder) {
    // Check if the agent can perform operation
    await checkAuthorization(
      context,
      agent,
      organizationId,
      null,
      AppResourceType.Folder,
      makeBasePermissionOwnerList(organizationId),
      BasicCRUDActions.Create
    );
  }

  // Return existing folders to skip ahead when creating parent folders for the main folder
  return {existingFolders};
}

export async function createFolderList(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  input: INewFolderInput
) {
  // TODO: add a max slash (folder separator count) for folder names and
  // if we're going to have arbitrarily deep folders, then we should rethink the
  // creation process for performance
  const pathWithDetails = assertSplitPathWithDetails(input.path);
  const {existingFolders} = await checkIfAgentCanCreateFolder(
    context,
    agent,
    organizationId,
    pathWithDetails.splitParentPath
  );

  let previousFolder: IFolder | null = null;

  // TODO: create folders in a transaction and revert if there's an error
  for (let i = 0; i < pathWithDetails.splitPath.length; i++) {
    const nextInputPath = pathWithDetails.splitPath.slice(0, i + 1);
    previousFolder = existingFolders[i];

    if (previousFolder) {
      continue;
    }

    // The main folder we want to create
    const isMainFolder = i === pathWithDetails.splitPath.length - 1;
    const nextInput: INewFolderInput = {
      path: nextInputPath.join(folderConstants.nameSeparator),
      description: isMainFolder ? input.description : undefined,
      maxFileSize: isMainFolder ? input.maxFileSize : undefined,
    };

    previousFolder = await createNextFolder(
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
