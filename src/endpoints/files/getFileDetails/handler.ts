import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {validate} from '../../../utilities/validate';
import {IBaseContext} from '../../contexts/BaseContext';
import {InvalidRequestError} from '../../errors';
import {folderConstants} from '../../folders/constants';
import {getFolderByName} from '../../folders/getFolder/handler';
import FileQueries from '../queries';
import {FileUtils} from '../utils';
import {GetFileDetailsEndpoint} from './types';
import {getFileDetailsJoiSchema} from './validation';

export async function getFileByName(
  context: IBaseContext,
  name: string,
  bucketId?: string
): Promise<IFile> {
  const names = name.split(folderConstants.nameSeparator);
  const fileName = names[names.length - 1];
  let folder: IFolder | null = null;

  if (names.length === 0) {
    throw new InvalidRequestError('Missing file name');
  }

  if (names.length > 1) {
    const folderName = names.slice(0, names.length - 1);
    const folders = await getFolderByName(
      context,
      folderName.join(folderConstants.nameSeparator)
    );
    folder = folders[folders.length - 1];
  }

  if (folder) {
    return await context.data.file.assertGetItem(
      FileQueries.getByNameAndFolderId(fileName, folder.folderId)
    );
  } else if (bucketId) {
  }
}

export async function getFileByIdOrPath(
  context: IBaseContext,
  fileId: string | null | undefined,
  path: string | null | undefined
) {
  if (fileId) {
    return await context.data.file.assertGetItem(FileQueries.getById(fileId));
  } else if (path) {
    return await context.data.file.assertGetItem(
      FileQueries.getByNamePath(path.split(folderConstants.nameSeparator))
    );
  }

  throw new Error(); // TODO: add the right error
}

const getFileDetails: GetFileDetailsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFileDetailsJoiSchema);
  const user = await context.session.getUser(context, instData);
  const file = await getFileByIdOrPath(context, data.fileId, data.path);

  return {
    file: FileUtils.getPublicFile(file),
  };
};

export default getFileDetails;
