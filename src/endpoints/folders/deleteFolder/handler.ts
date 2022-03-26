import {IFolder} from '../../../definitions/folder';
import {
  AppResourceType,
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import {IBaseContext} from '../../contexts/BaseContext';
import FileQueries from '../../files/queries';
import PermissionItemQueries from '../../permissionItems/queries';
import FolderQueries from '../queries';
import {checkFolderAuthorization03, getFolderMatcher} from '../utils';
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
    keys: files.map(file => file.resourceId),
  });
}

async function internalDeleteFolder(context: IBaseContext, folder: IFolder) {
  // TODO: log jobs that fail so that we can retry them
  await waitOnPromises([
    deleteFilesByFolderId(context, folder.resourceId),
    internalDeleteFolderList(
      context,
      await context.data.folder.getManyItems(
        FolderQueries.getFoldersByParentId(folder.resourceId)
      )
    ),
  ]);

  await waitOnPromises([
    context.data.folder.deleteManyItems(
      FolderQueries.getFoldersByParentId(folder.resourceId)
    ),
    context.data.folder.deleteItem(FolderQueries.getById(folder.resourceId)),
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
  const agent = await context.session.getAgent(
    context,
    instData,
    publicPermissibleEndpointAgents
  );

  const {folder} = await checkFolderAuthorization03(
    context,
    agent,
    getFolderMatcher(agent, data),
    BasicCRUDActions.Delete
  );

  // TODO: this be fire and forget with retry OR move it to a job
  await waitOnPromises([
    // Delete files that exist inside the folder and it's children
    internalDeleteFolder(context, folder),

    // Delete permission items that are owned by the folder
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByOwner(
        folder.resourceId,
        AppResourceType.Folder
      )
    ),

    // Delete permission items that explicitly give access to the folder
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByResource(
        folder.resourceId,
        AppResourceType.Folder
      )
    ),
  ]);

  // await context.data.folder.deleteManyItems(
  //   FolderQueries.getFoldersWithNamePath(organizationId, splitPath)
  // );
};

export default deleteFolder;
