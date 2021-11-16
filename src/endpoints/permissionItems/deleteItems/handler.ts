import {validate} from '../../../utilities/validate';
import PermissionItemsQueries from '../queries';
import {DeletePermissionItemsEndpoint} from './types';
import {deletePermissionItemsJoiSchema} from './validation';

const deletePermissionItems: DeletePermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deletePermissionItemsJoiSchema);
  await context.session.getUser(context, instData);
  await context.data.permissionItem.deleteManyItems(
    PermissionItemsQueries.getByIds(data.itemIds)
  );
};

export default deletePermissionItems;
