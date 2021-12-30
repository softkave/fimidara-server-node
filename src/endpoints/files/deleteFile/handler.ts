import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import {getOrganizationId} from '../../contexts/SessionContext';
import PermissionItemQueries from '../../permissionItems/queries';
import FileQueries from '../queries';
import {checkFileAuthorization03} from '../utils';
import {DeleteFileEndpoint} from './types';
import {deleteFileJoiSchema} from './validation';

const deleteFile: DeleteFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteFileJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const {file} = await checkFileAuthorization03(
    context,
    agent,
    organizationId,
    data.path,
    BasicCRUDActions.Delete
  );

  await waitOnPromises([
    // Delete permission items that explicitly give access to this resource
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByResource(file.fileId, AppResourceType.File)
    ),

    // Delete permission items that are owned by the file
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByOwner(file.fileId, AppResourceType.File)
    ),

    context.data.file.deleteItem(FileQueries.getById(file.fileId)),
  ]);
};

export default deleteFile;
