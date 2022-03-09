import {IPermissionItem} from '../../../definitions/permissionItem';
import {validate} from '../../../utilities/validate';
import {checkOrganizationExists} from '../../organizations/utils';
import checkEntityExists from '../checkEntityExists';
import checkOwnersExist from '../checkOwnersExist';
import {PermissionItemUtils} from '../utils';
import {savePermissionItems} from './savePermissionItems';
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

  await checkOwnersExist(context, agent, organization, data.items, true);
  let items: IPermissionItem[] = await savePermissionItems(
    context,
    agent,
    data
  );

  return {
    items: PermissionItemUtils.extractPublicPermissionItemList(items),
  };
};

export default addPermissionItems;
