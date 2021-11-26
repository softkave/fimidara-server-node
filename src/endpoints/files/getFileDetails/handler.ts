import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {checkFileAuthorizationWithPath, FileUtils} from '../utils';
import {GetFileDetailsEndpoint} from './types';
import {getFileDetailsJoiSchema} from './validation';

// export async function getFileByName(
//   context: IBaseContext,
//   name: string
// ): Promise<IFile> {
//   const names = name.split(folderConstants.nameSeparator);
//   const fileName = names[names.length - 1];
//   let folder: IFolder | null = null;

//   if (names.length === 0) {
//     throw new InvalidRequestError('Missing file name');
//   }

//   if (names.length > 1) {
//     const folderName = names.slice(0, names.length - 1);
//     const folders = await getFolderByName(
//       context,
//       folderName.join(folderConstants.nameSeparator)
//     );
//     folder = folders[folders.length - 1];
//   }

//   if (folder) {
//     return await context.data.file.assertGetItem(
//       FileQueries.getByNameAndFolderId(fileName, folder.folderId)
//     );
//   }

//   throw new InvalidRequestError('Missing bucket or folder');
// }

// async function getFileByIdOrPath(
//   context: IBaseContext,
//   fileId: string | null | undefined,
//   path: string | null | undefined
// ) {
//   if (fileId) {
//     return await context.data.file.assertGetItem(FileQueries.getById(fileId));
//   } else if (path) {
//     return await getFileByName(context, path);
//   }

//   throw new InvalidRequestError('Missing file ID or file path');
// }

const getFileDetails: GetFileDetailsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFileDetailsJoiSchema);
  const {file} = await checkFileAuthorizationWithPath(
    context,
    instData,
    data.path,
    BasicCRUDActions.Read
  );

  return {
    file: FileUtils.getPublicFile(file),
  };
};

export default getFileDetails;
