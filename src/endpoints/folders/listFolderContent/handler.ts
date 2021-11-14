import {validate} from '../../../utilities/validate';
import {IBaseContext} from '../../contexts/BaseContext';
import {InvalidRequestError} from '../../errors';
import FileQueries from '../../files/queries';
import {FileUtils} from '../../files/utils';
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
    return await Promise.all([
      context.data.folder.getManyItems(
        FolderQueries.getFoldersByBucketId(bucketId)
      ),
      context.data.file.getManyItems(FileQueries.getFilesByBucketId(bucketId)),
    ]);
  }

  if (parentPath) {
    const folders = await getFolderByName(context, parentPath);
    const parentFolder = folders[folders.length - 1];
    parentId = parentFolder.folderId;
  }

  if (parentId) {
    return await Promise.all([
      context.data.folder.getManyItems(
        FolderQueries.getFoldersByParentId(parentId)
      ),
      context.data.file.getManyItems(FileQueries.getFilesByParentId(parentId)),
    ]);
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
  const [folders, files] = await getFoldersByBucketIdParentIdOrPath(
    context,
    data.bucketId,
    data.parentFolderId,
    data.parentFolderPath
  );

  return {
    folders: FolderUtils.getPublicFolderList(folders),
    files: FileUtils.getPublicFileList(files),
  };
};

export default listFolderContent;
