import {BasicCRUDActions, AppResourceType} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import checkResourcesExist from '../checkResourcesExist';
import PermissionItemQueries from '../queries';
import {PermissionItemUtils} from '../utils';
import {GetResourcePermissionItemsEndpoint} from './types';
import {getResourcePermissionItemsJoiSchema} from './validation';

const getResourcePermissionItems: GetResourcePermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getResourcePermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  await checkResourcesExist(context, agent, organization, [data]);
  await checkAuthorization({
    context,
    agent,
    organization,
    action: BasicCRUDActions.Read,
    type: AppResourceType.PermissionItem,
    permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
  });

  const items = await context.data.permissionItem.getManyItems(
    PermissionItemQueries.getByResource(
      organization.resourceId,
      data.itemResourceId,
      data.itemResourceType
    )
  );

  return {
    items: PermissionItemUtils.extractPublicPermissionItemList(items),
  };
};

export default getResourcePermissionItems;
