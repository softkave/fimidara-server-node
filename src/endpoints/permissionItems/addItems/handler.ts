import {IPermissionItem} from '../../../definitions/permissionItem';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {checkOrganizationExists} from '../../organizations/utils';
import checkEntityExists from '../checkEntityExists';
import {PermissionItemUtils} from '../utils';
import {AddPermissionItemsEndpoint} from './types';
import {addPermissionItemsJoiSchema} from './validation';

const addPermissionItems: AddPermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, addPermissionItemsJoiSchema);
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

  const items: IPermissionItem[] = data.items.map(input => {
    const item: IPermissionItem = {
      ...input,
      itemId: getNewId(),
      createdAt: getDateString(),
      createdBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
      organizationId: organization.organizationId,
      permissionEntityId: data.permissionEntityId,
      permissionEntityType: data.permissionEntityType,
    };

    return item;
  });

  // Insert new permission items
  await context.data.permissionItem.bulkSaveItems(items);
  return {
    items: PermissionItemUtils.extractPublicPermissionItemList(items),
  };
};

export default addPermissionItems;
