import {IFolder} from '../../../definitions/folder';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import {IBaseContext} from '../../contexts/BaseContext';
import {getOrganizationId} from '../../contexts/SessionContext';
import FileQueries from '../../files/queries';
import PermissionItemQueries from '../../permissionItems/queries';
import FolderQueries from '../queries';
import {assertSplitFolderPath, checkFolderAuthorization03} from '../utils';
import {DeleteFolderEndpoint} from './types';
import {deleteFolderJoiSchema} from './validation';

async function deleteFilesByFolderId(context: IBaseContext, folderId: string) {
  // TODO: should we get files by name path, paginated
  const files = await context.data.file.getManyItems(
    FileQueries.getFilesByParentId(folderId)
  );

  await context.data.file.deleteManyItems(
    FileQueries.getFilesByParentId(folderId)
  );

  await context.fileBackend.deleteFiles({
    bucket: context.appVariables.S3Bucket,
    keys: files.map(file => file.fileId),
  });
}

async function internalDeleteFolder(context: IBaseContext, folder: IFolder) {
  // TODO: log jobs that fail so that we can retry them
  await waitOnPromises([
    deleteFilesByFolderId(context, folder.folderId),
    internalDeleteFolderList(
      context,
      await context.data.folder.getManyItems(
        FolderQueries.getFoldersByParentId(folder.folderId)
      )
    ),
  ]);

  await waitOnPromises([
    context.data.folder.deleteManyItems(
      FolderQueries.getFoldersByParentId(folder.folderId)
    ),
    context.data.folder.deleteItem(FolderQueries.getById(folder.folderId)),
  ]);
}

export async function internalDeleteFolderList(
  context: IBaseContext,
  folders: IFolder[]
) {
  // TODO: log jobs that fail so that we can retry them
  await waitOnPromises(
    folders.map(async folder => {
      return internalDeleteFolder(context, folder);
    })
  );
}

const deleteFolder: DeleteFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const splitPath = assertSplitFolderPath(data.path);
  const {folder} = await checkFolderAuthorization03(
    context,
    agent,
    organizationId,
    splitPath,
    BasicCRUDActions.Delete
  );

  // TODO: this be fire and forget with retry OR move it to a job
  await waitOnPromises([
    // Delete files that exist inside the folder and it's children
    internalDeleteFolder(context, folder),

    // Delete permission items that are owned by the folder
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByOwner(folder.folderId, AppResourceType.Folder)
    ),

    // Delete permission items that explicitly give access to the folder
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByResource(
        folder.folderId,
        AppResourceType.Folder
      )
    ),
  ]);

  // await context.data.folder.deleteManyItems(
  //   FolderQueries.getFoldersWithNamePath(organizationId, splitPath)
  // );
};

export default deleteFolder;
