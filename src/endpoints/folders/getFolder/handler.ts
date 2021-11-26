import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import {checkFolderAuthorizationWithPath, folderExtractor} from '../utils';
import {GetFolderEndpoint} from './types';
import {getFolderJoiSchema} from './validation';

// // The last entry is the requested folder
// export async function getFolderByName(
//   context: IBaseContext,
//   name: string,
//   parent?: IFolder
// ): Promise<IFolder[]> {
//   const names = name.split(folderConstants.nameSeparator);
//   const folders: IFolder[] = parent ? [parent] : [];

//   for (let i = 0; i < names.length; i++) {
//     const currentName = names[i];
//     const prevFolder = folders[folders.length - 1];
//     const folder = await context.data.folder.assertGetItem(
//       FolderQueries.getByName(currentName, prevFolder)
//     );
//     folders.push(folder);
//   }

//   if (folders.length === 0) {
//     throw new FolderNotFoundError();
//   }

//   return folders;
// }

// export async function getFolderByIdOrPath(
//   context: IBaseContext,
//   folderId: string | null | undefined,
//   path: string | null | undefined
// ) {
//   if (folderId) {
//     return await context.data.folder.assertGetItem(
//       FolderQueries.getById(folderId)
//     );
//   } else if (path) {
//     const folders = await getFolderByName(context, path);
//     return folders[folders.length - 1];
//   }

//   throw new InvalidRequestError('Missing folder ID or path');
// }

const getFolder: GetFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFolderJoiSchema);

  // if (!data.folderId || !data.path) {
  //   throw new InvalidRequestError('Missing folder ID or path');
  // }

  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const {folder} = await checkFolderAuthorizationWithPath(
    context,
    agent,
    organizationId,
    data.path,
    BasicCRUDActions.Read
  );

  return {
    folder: folderExtractor(folder),
  };
};

export default getFolder;
