import {validate} from '../../../utilities/validate';
import PermissionItemQueries from '../queries';
import {PermissionItemUtils} from '../utils';
import {GetPermissionEntityPermissionItemsEndpoint} from './types';
import {getPermissionEntityPermissionItemsJoiSchema} from './validation';

const getPermissionEntityPermissionItems: GetPermissionEntityPermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(
    instData.data,
    getPermissionEntityPermissionItemsJoiSchema
  );
  await context.session.getUser(context, instData);
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

export default getPermissionEntityPermissionItems;
