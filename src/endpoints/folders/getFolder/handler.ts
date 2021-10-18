import {validate} from '../../../utilities/validate';
import {IBaseContext} from '../../contexts/BaseContext';
import {folderConstants} from '../constants';
import FolderQueries from '../queries';
import {folderExtractor} from '../utils';
import {GetFolderEndpoint} from './types';
import {getFolderJoiSchema} from './validation';

export async function getFolderByIdOrPath(
  context: IBaseContext,
  folderId: string | null | undefined,
  path: string | null | undefined
) {
  if (folderId) {
    return await context.data.folder.assertGetItem(
      FolderQueries.getById(folderId)
    );
  } else if (path) {
    return await context.data.folder.assertGetItem(
      FolderQueries.getByNamePath(
        path.split(folderConstants.folderNameSeparator)
      )
    );
  }

  throw new Error(); // TODO: add the right error
}

const getFolder: GetFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFolderJoiSchema);

  if (!data.folderId || !data.path) {
    throw new Error(); // TODO: add the right error
  }

  const user = await context.session.getUser(context, instData);
  const folder = await getFolderByIdOrPath(context, data.folderId, data.path);

  return {
    folder: folderExtractor(folder),
  };
};

export default getFolder;
