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
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/BaseContext';
import {getOrganizationId} from '../../contexts/SessionContext';
import {fileConstants} from '../../files/constants';
import {folderConstants} from '../constants';
import FolderQueries from '../queries';
import {
  assertSplitFolderPathWithDetails,
  FolderUtils,
  splitFolderPathWithDetails,
} from '../utils';
import {AddFolderEndpoint, INewFolderInput} from './types';
import {addFolderJoiSchema} from './validation';

async function internalCreateFolder(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  parent: IFolder | null,
  input: INewFolderInput
) {
  const {splitPath, name} = splitFolderPathWithDetails(input.path);
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
  const parentPaths: Array<string[]> = [];
  splitParentPath.forEach((item, i) => {
    i === 0
      ? parentPaths.push([item])
      : parentPaths.push(parentPaths[i - 1].concat(item));
  });

  const existingFolders = await Promise.all(
    parentPaths.map(item =>
      context.data.folder.getItem(
        FolderQueries.getByNamePath(organizationId, item)
      )
    )
  );

  let closestExistingFolder: IFolder | null = null;

  for (const item of existingFolders) {
    if (item === null) {
      break;
    }

    closestExistingFolder = item;
  }

  if (closestExistingFolder) {
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
  const {splitPath, splitParentPath} = assertSplitFolderPathWithDetails(
    input.path
  );

  await checkIfAgentCanCreateFolder(
    context,
    agent,
    organizationId,
    splitParentPath
  );

  let previousFolder: IFolder | null = null;

  // TODO: create folders in a transaction and revert if there's an error
  for (let i = 0; i < splitPath.length; i++) {
    const nextInputPath = splitPath.slice(0, i + 1);
    const isMainFolder = i === splitPath.length - 1;
    const nextInput: INewFolderInput = {
      path: nextInputPath.join(folderConstants.nameSeparator),
      description: isMainFolder ? input.description : undefined,
      maxFileSize: isMainFolder ? input.maxFileSize : undefined,
    };

    previousFolder = await internalCreateFolder(
      context,
      agent,
      organizationId,
      previousFolder,
      nextInput
    );
  }

  if (!previousFolder) {
    throw new ServerError('Error creating folder');
  }

  return previousFolder;
}

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
