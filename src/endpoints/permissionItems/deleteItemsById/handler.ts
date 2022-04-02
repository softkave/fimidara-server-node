import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getOrganizationId} from '../../contexts/SessionContext';
import {checkOrganizationExists} from '../../organizations/utils';
import EndpointReusableQueries from '../../queries';
import {DeletePermissionItemsByIdEndpoint} from './types';
import {deletePermissionItemsByIdJoiSchema} from './validation';

const deletePermissionItemsById: DeletePermissionItemsByIdEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deletePermissionItemsByIdJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = await getOrganizationId(agent, data.organizationId);
  const organization = await checkOrganizationExists(context, organizationId);
  await checkAuthorization({
    context,
    agent,
    organization,
    action: BasicCRUDActions.GrantPermission,
    type: AppResourceType.PermissionItem,
    permissionOwners: makeOrgPermissionOwnerList(organizationId),
  });

  await context.data.permissionItem.deleteManyItems(
    EndpointReusableQueries.getByOrgIdAndIds(organizationId, data.itemIds)
  );
};

export default deletePermissionItemsById;
