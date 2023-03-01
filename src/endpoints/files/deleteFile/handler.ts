import {IFile} from '../../../definitions/file';
import {
  AppResourceType,
  BasicCRUDActions,
  PUBLIC_PERMISSIBLE_AGENTS,
} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {waitOnPromises} from '../../../utils/waitOnPromises';
import {deleteResourceAssignedItems} from '../../assignedItems/deleteAssignedItems';
import {IBaseContext} from '../../contexts/types';
import PermissionItemQueries from '../../permissionItems/queries';
import EndpointReusableQueries from '../../queries';
import {checkFileAuthorization03} from '../utils';
import {DeleteFileEndpoint} from './types';
import {deleteFileJoiSchema} from './validation';

const deleteFile: DeleteFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteFileJoiSchema);
  const agent = await context.session.getAgent(context, instData, PUBLIC_PERMISSIBLE_AGENTS);
  const {file} = await checkFileAuthorization03(context, agent, data, BasicCRUDActions.Delete);
  await deleteFileAndArtifacts(context, file);
};

export async function deleteFileAndArtifacts(context: IBaseContext, file: IFile) {
  await waitOnPromises([
    // Delete permission items that explicitly give access to this resource
    context.semantic.permissionItem.deleteManyByQuery(
      PermissionItemQueries.getByResource(file.workspaceId, file.resourceId, AppResourceType.File)
    ),

    // Delete assigned tags and permissionGroups
    deleteResourceAssignedItems(context, file.workspaceId, file.resourceId),
    context.semantic.file.deleteOneByQuery(
      EndpointReusableQueries.getByResourceId(file.resourceId)
    ),
  ]);
}

export default deleteFile;
