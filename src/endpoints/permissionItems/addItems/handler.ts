import {IPermissionItem} from '../../../definitions/permissionItem';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {PermissionItemUtils} from '../utils';
import {AddPermissionItemsEndpoint} from './types';
import {addPermissionItemsJoiSchema} from './validation';

const addPermissionItems: AddPermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, addPermissionItemsJoiSchema);
  const user = await context.session.getUser(context, instData);
  const items: IPermissionItem[] = data.items.map(item => ({
    ...item,
    itemId: getNewId(),
    createdAt: getDateString(),
    createdBy: user.userId,
  }));

  await context.data.permissionItem.bulkSaveItems(items);

  return {
    items: PermissionItemUtils.extractPublicPermissionItemList(items),
  };
};

export default addPermissionItems;
