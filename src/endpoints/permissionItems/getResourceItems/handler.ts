import {validate} from '../../../utilities/validate';
import PermissionItemQueries from '../queries';
import {PermissionItemUtils} from '../utils';
import {GetResourcePermissionItemsEndpoint} from './types';
import {getResourcePermissionItemsJoiSchema} from './validation';

const getResourcePermissionItems: GetResourcePermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getResourcePermissionItemsJoiSchema);
  await context.session.getUser(context, instData);
  const items = await context.data.permissionItem.getManyItems(
    PermissionItemQueries.getByResource(data.resourceId, data.resourceType)
  );

  return {
    items: PermissionItemUtils.extractPublicPermissionItemList(items),
  };
};

export default getResourcePermissionItems;
