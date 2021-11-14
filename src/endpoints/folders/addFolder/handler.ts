import {IFolder} from '../../../definitions/folder';
import {SessionAgentType} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utilities/dateFns';
import {ServerError} from '../../../utilities/errors';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {IBaseContext} from '../../contexts/BaseContext';
import {fileConstants} from '../../files/constants';
import {folderConstants} from '../constants';
import FolderQueries from '../queries';
import {FolderUtils} from '../utils';
import {AddFolderEndpoint, INewFolderInput} from './types';
import {addFolderJoiSchema} from './validation';

async function internalCreateFolder(
  context: IBaseContext,
  user: IUser,
  input: INewFolderInput
) {
  const existingFolder = await context.data.folder.getItem(
    FolderQueries.folderExists(input.bucketId, input.parentId, input.path)
  );

  if (existingFolder) {
    return existingFolder;
  }

  const newFolderId = getNewId();
  const newFolder: IFolder = {
    parentId: input.parentId,
    name: input.path,
    createdAt: getDateString(),
    createdBy: {
      agentId: user.userId,
      agentType: SessionAgentType.User,
    },
    folderId: newFolderId,
    description: input.description,
    environmentId: input.environmentId,
    maxFileSize: input.maxFileSize || fileConstants.maxFileSize,
    organizationId: input.organizationId,
    bucketId: input.bucketId,
  };

  return await context.data.folder.saveItem(newFolder);
}

export async function createFolderList(
  context: IBaseContext,
  user: IUser,
  input: INewFolderInput
) {
  // TODO: add a max slash (folder separator count) for folder names and
  // if we're going to have arbitrarily deep folders, then we should rethink the
  // creation process for performance
  const folderNames = input.path.split(folderConstants.nameSeparator);
  let previousFolder: IFolder | null = null;

  // TODO: create folders in a transaction and revert if there's an error
  for (let i = 0; i < folderNames.length; i++) {
    const nextInputName = folderNames[i];
    const isInputFile = i === folderNames.length - 1;
    const nextInput: INewFolderInput = {
      organizationId: input.organizationId,
      environmentId: input.environmentId,
      bucketId: input.bucketId,
      path: nextInputName,
      parentId: previousFolder ? previousFolder.folderId : undefined,
      description: isInputFile ? input.description : undefined,
      maxFileSize: isInputFile ? input.maxFileSize : undefined,
    };

    previousFolder = await internalCreateFolder(context, user, nextInput);
  }

  if (!previousFolder) {
    throw new ServerError();
  }

  return previousFolder;
}

const addFolder: AddFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, addFolderJoiSchema);
  const user = await context.session.getUser(context, instData);

  await context.environment.assertEnvironmentById(
    context,
    data.folder.environmentId
  );

  const folder = await createFolderList(context, user, data.folder);
  const publicFolder = FolderUtils.getPublicFolder(folder);

  return {
    folder: publicFolder,
  };
};

export default addFolder;
