import {IPermissionItem} from '../../../definitions/permissionItem';
import {validate} from '../../../utilities/validate';
import {checkOrganizationExists} from '../../organizations/utils';
import checkEntitiesExist from '../checkEntitiesExist';
import checkPermissionOwnersExist from '../checkPermissionOwnersExist';
import {PermissionItemUtils} from '../utils';
import {savePermissionItems} from './savePermissionItems';
import {ReplacePermissionItemsByEntityEndpoint} from './types';
import {replacePermissionItemsByEntityJoiSchema} from './validation';

/**
 * Creates permission items that replace the existing ones.
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

const replacePermissionItemsByEntity: ReplacePermissionItemsByEntityEndpoint =
  async (context, instData) => {
    const data = validate(
      instData.data,
      replacePermissionItemsByEntityJoiSchema
    );
    const agent = await context.session.getAgent(context, instData);
    const organization = await checkOrganizationExists(
      context,
      data.organizationId
    );

    await checkEntitiesExist(
      context,
      agent,
      organization.resourceId,
      data.permissionEntityId,
      data.permissionEntityType
    );

    await checkPermissionOwnersExist(
      context,
      agent,
      organization,
      data.items,
      true
    );
    const items: IPermissionItem[] = await savePermissionItems(
      context,
      agent,
      data
    );

    return {
      items: PermissionItemUtils.extractPublicPermissionItemList(items),
    };
  };

export default replacePermissionItemsByEntity;
