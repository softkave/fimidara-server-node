import {validate} from '../../../utilities/validate';
import {checkOrganizationExists} from '../../organizations/utils';
import checkEntityExists from '../checkEntityExists';
import PermissionItemsQueries from '../queries';
import {DeletePermissionItemsEndpoint} from './types';
import {deletePermissionItemsJoiSchema} from './validation';

const deletePermissionItems: DeletePermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deletePermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  await checkEntityExists(
    context,
    agent,
    organization.organizationId,
    data.permissionEntityId,
    data.permissionEntityType
  );

  await context.data.permissionItem.deleteManyItems(
    PermissionItemsQueries.getByIds(data.itemIds)
  );
};

export default deletePermissionItems;
