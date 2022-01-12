import {IPermissionItem} from '../../../definitions/permissionItem';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {checkOrganizationExists} from '../../organizations/utils';
import checkEntityExists from '../checkEntityExists';
import checkOwnersExist from '../checkOwnersExist';
import {PermissionItemUtils} from '../utils';
import {AddPermissionItemsEndpoint} from './types';
import {addPermissionItemsJoiSchema} from './validation';

/**
 * addPermissionItems.
 * Creates permission items.
 *
 * Ensure that:
 * - Auth check
 * - Check that the entity the items belong to exist and do access check
 * - Check that owner exists and of provided type
 * - Check that resource IDs exist and belong to owner
 * - Save items
 *
 * TODO:
 * - [High] Check that resource exists in the organization
 */

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
    organization.resourceId,
    data.permissionEntityId,
    data.permissionEntityType
  );

  await checkOwnersExist(
    context,
    agent,
    organization.resourceId,
    data.items,
    true
  );

  const items: IPermissionItem[] = data.items.map(input => {
    const item: IPermissionItem = {
      ...input,
      resourceId: getNewId(),
      createdAt: getDateString(),
      createdBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
      organizationId: organization.resourceId,
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
