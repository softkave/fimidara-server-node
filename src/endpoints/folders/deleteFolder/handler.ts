import {IFolder} from '../../../definitions/folder';
import {
  AppResourceType,
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {waitOnPromises} from '../../../utils/waitOnPromises';
import {deleteResourceAssignedItems} from '../../assignedItems/deleteAssignedItems';
import {IBaseContext} from '../../contexts/types';
import {deleteFileAndArtifacts} from '../../files/deleteFile/handler';
import PermissionItemQueries from '../../permissionItems/queries';
import EndpointReusableQueries from '../../queries';
import FolderQueries from '../queries';
import {checkFolderAuthorization02} from '../utils';
import {DeleteFolderEndpoint} from './types';
import {deleteFolderJoiSchema} from './validation';

async function deleteFilesByFolderId(context: IBaseContext, workspaceId: string, folderId: string) {
  // TODO: should we get files by name path, paginated
  const files = await context.data.file.getManyByQuery(
    FolderQueries.getByParentId(workspaceId, folderId)
  );
  await waitOnPromises(
    // Delete file and assigned items
    files.map(file => deleteFileAndArtifacts(context, file))
  );

  await context.fileBackend.deleteFiles({
    bucket: context.appVariables.S3Bucket,
    keys: files.map(file => file.resourceId),
  });
}

async function internalDeleteFolder(context: IBaseContext, folder: IFolder) {
  // TODO: log jobs that fail so that we can retry them
  await waitOnPromises([
    deleteFilesByFolderId(context, folder.workspaceId, folder.resourceId),
    internalDeleteFolderList(
      context,
      await context.data.folder.getManyByQuery(
        FolderQueries.getByParentId(folder.workspaceId, folder.resourceId)
      )
    ),
  ]);

  await waitOnPromises([
    // Delete folder children folders
    context.data.folder.deleteManyByQuery(
      FolderQueries.getByParentId(folder.workspaceId, folder.resourceId)
    ),

    // Delete folder
    context.data.folder.deleteOneByQuery(
      EndpointReusableQueries.getByResourceId(folder.resourceId)
    ),

    // Delete folder assigned items like tags
    deleteResourceAssignedItems(
      context,
      folder.workspaceId,
      folder.resourceId,
      AppResourceType.Folder
    ),

    // Delete permission items that are owned by the folder
    context.data.permissionItem.deleteManyByQuery(
      PermissionItemQueries.getByContainer(folder.resourceId)
    ),

    // Delete permission items that explicitly give access to the folder
    context.data.permissionItem.deleteManyByQuery(
      PermissionItemQueries.getByResource(
        folder.workspaceId,
        folder.resourceId,
        AppResourceType.Folder
      )
    ),
  ]);
}

export async function internalDeleteFolderList(context: IBaseContext, folders: IFolder[]) {
  // TODO: log jobs that fail so that we can retry them
  await waitOnPromises(
    folders.map(async folder => {
      return internalDeleteFolder(context, folder);
    })
  );
}

const deleteFolder: DeleteFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData, publicPermissibleEndpointAgents);
  const {folder} = await checkFolderAuthorization02(context, agent, data, BasicCRUDActions.Delete);

  // TODO: this be fire and forget with retry OR move it to a job
  await internalDeleteFolder(context, folder);
};

export default deleteFolder;
