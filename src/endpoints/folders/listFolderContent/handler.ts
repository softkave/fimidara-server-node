import {validate} from '../../../utilities/validate';
import {IBaseContext} from '../../contexts/BaseContext';
import {InvalidRequestError} from '../../errors';
import {folderConstants} from '../constants';
import {getFolderByName} from '../getFolder/handler';
import FolderQueries from '../queries';
import {FolderUtils} from '../utils';
import {ListFolderContentEndpoint} from './types';
import {listFolderContentJoiSchema} from './validation';

export async function getFoldersByBucketIdParentIdOrPath(
  context: IBaseContext,
  bucketId: string | null | undefined,
  parentId: string | null | undefined,
  parentPath: string | null | undefined
) {
  if (bucketId) {
    return await context.data.folder.getManyItems(
      FolderQueries.getFoldersByBucketId(bucketId)
    );
  }

  if (parentId) {
    return await context.data.folder.getManyItems(
      FolderQueries.getFoldersByParentId(parentId)
    );
  }

  if (parentPath) {
    const folders = await getFolderByName(context, parentPath);
    return folders[folders.length - 1];
  }

  throw new InvalidRequestError(
    'Missing bucket ID or parent ID or parent path'
  );
}

const listFolderContent: ListFolderContentEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, listFolderContentJoiSchema);
  await context.session.getUser(context, instData);
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

export default listFolderContent;
