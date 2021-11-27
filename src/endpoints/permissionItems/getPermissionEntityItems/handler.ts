import {validate} from '../../../utilities/validate';
import {checkOrganizationExists} from '../../organizations/utils';
import checkEntityExists from '../checkEntityExists';
import PermissionItemQueries from '../queries';
import {PermissionItemUtils} from '../utils';
import {GetPermissionEntityPermissionItemsEndpoint} from './types';
import {getPermissionEntityPermissionItemsJoiSchema} from './validation';

const getPermissionEntityItems: GetPermissionEntityPermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(
    instData.data,
    getPermissionEntityPermissionItemsJoiSchema
  );

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

  const items = await context.data.permissionItem.getManyItems(
    PermissionItemQueries.getByPermissionEntity(
      data.permissionEntityId,
      data.permissionEntityType
    )
  );

  return {
    items: PermissionItemUtils.extractPublicPermissionItemList(items),
  };
};

export default getPermissionEntityItems;
