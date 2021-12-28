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

async function deleteFiles(context: IBaseContext, folderId: string) {
  const files = await context.data.file.getManyItems(
    FileQueries.getFilesByParentId(folderId)
  );

  await context.fileBackend.deleteFiles({
    bucket: context.appVariables.S3Bucket,
    keys: files.map(file => file.fileId),
  });
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

  await context.data.folder.deleteManyItems(
    FolderQueries.getFoldersWithNamePath(organizationId, splitPath)
  );

  // TODO: this be fire and forget with retry OR move it to a job
  await waitOnPromises([
    // Delete files that exist inside the folder and it's children
    deleteFiles(context, folder.folderId),

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
};

export default deleteFolder;
