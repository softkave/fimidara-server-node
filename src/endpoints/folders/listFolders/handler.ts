import {validate} from '../../../utilities/validate';
import {IBaseContext} from '../../contexts/BaseContext';
import {folderConstants} from '../constants';
import FolderQueries from '../queries';
import {FolderUtils} from '../utils';
import {GetFoldersEndpoint} from './types';
import {getFoldersJoiSchema} from './validation';

export async function getFoldersByBucketIdParentIdOrPath(
  context: IBaseContext,
  bucketId: string | null | undefined,
  parentFolderId: string | null | undefined,
  parentFolderPath: string | null | undefined
) {
  if (bucketId) {
    return await context.data.folder.getManyItems(
      FolderQueries.getImmediateFoldersByBucketId(bucketId)
    );
  }

  if (parentFolderId) {
    return await context.data.folder.getManyItems(
      FolderQueries.getFoldersByParentId(parentFolderId)
    );
  }

  if (parentFolderPath) {
    return await context.data.folder.getManyItems(
      FolderQueries.getFoldersByParentNamePath(
        parentFolderPath.split(folderConstants.folderNameSeparator)
      )
    );
  }

  throw new Error(); // TODO: add the right error
}

// TODO: should this just list folders or files also
// TODO: should we merge files and folders into one API
const getFolders: GetFoldersEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFoldersJoiSchema);
  const user = await context.session.getUser(context, instData);
  const folders = await getFoldersByBucketIdParentIdOrPath(
    context,
    data.bucketId,
    data.parentFolderId,
    data.parentFolderPath
  );

  return {
    folders: FolderUtils.getPublicFolderList(folders),
  };
};

export default getFolders;
