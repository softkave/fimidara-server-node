import {IFolder} from '../../../definitions/folder';
import {SessionAgentType} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {IBaseContext} from '../../contexts/BaseContext';
import {MalformedRequestError} from '../../errors';
import {folderConstants} from '../constants';
import {folderExtractor} from '../utils';
import {AddFolderEndpoint} from './types';
import {addFolderJoiSchema} from './validation';

export async function getNewFolderNames(context: IBaseContext, name: string) {
  const names = name.split(folderConstants.folderNameSeparator);
  const nameExistsList = await Promise.all(
    names.map(item => context.folder.folderExists(context, item))
  );

  const newFolderNames: string[] = [];
  let pastExistingFolder = false;

  for (let i = nameExistsList.length; i >= 0; i--) {
    const nameExists = nameExistsList[i];

    if (nameExists) {
      pastExistingFolder = true;
    } else {
      if (pastExistingFolder) {
        // TODO: can we return a better error?
        throw new MalformedRequestError({
          message: 'Incorrect mixture of new and existing folders',
        });
      }

      newFolderNames.push(names[i]);
    }
  }

  return {names, newFolderNames};
}

export async function saveFolders(
  context: IBaseContext,
  user: IUser,
  folder: {
    name: string;
    description?: string;
    maxFileSize: number;
    organizationId: string;
    environmentId: string;
  }
) {
  const {names, newFolderNames} = await getNewFolderNames(context, folder.name);
  const inputFolderName = names[names.length - 1];
  const newFoldersNameIdMap: Record<string, string> = {};
  const newFolders = newFolderNames.reverse().map((name, i) => {
    const parentNameIndex = i - 1;
    const parentName =
      parentNameIndex >= 0 ? names[parentNameIndex] : undefined;
    const parentId = parentName && newFoldersNameIdMap[parentName];
    const isInputFolder = name === inputFolderName;
    const newFolder: IFolder = {
      parentId,
      name,
      createdAt: getDateString(),
      createdBy: {
        agentId: user.userId,
        agentType: SessionAgentType.User,
      },
      folderId: getNewId(),
      description: isInputFolder ? folder.description : '',
      environmentId: folder.environmentId,
      maxFileSize: folder.maxFileSize,
      organizationId: folder.organizationId,
    };

    newFoldersNameIdMap[folder.name] = newFolder.folderId;
    return newFolder;
  });

  const savedFolders = await context.folder.bulkSaveFolders(
    context,
    newFolders
  );

  return savedFolders;
}

const addFolder: AddFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, addFolderJoiSchema);
  const user = await context.session.getUser(context, instData);
  await context.environment.assertEnvironmentById(
    context,
    data.folder.environmentId
  );

  const savedFolders = await saveFolders(context, user, data.folder);
  const publicFolder = folderExtractor(savedFolders[savedFolders.length - 1]);
  return {
    folder: publicFolder,
  };
};

export default addFolder;
