import {validate} from '../../../utilities/validate';
import {checkOrganizationExists} from '../../organizations/utils';
import checkEntityExists from '../checkEntityExists';
import PermissionItemQueries from '../queries';
import {PermissionItemUtils} from '../utils';
import {GetEntityPermissionItemsEndpoint} from './types';
import {getEntityPermissionItemsJoiSchema} from './validation';

const getEntityPermissionItems: GetEntityPermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getEntityPermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  await checkEntityExists(
    context,
    agent,
    organization.resourceId,
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

export default getEntityPermissionItems;
