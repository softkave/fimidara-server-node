import {BasicCRUDActions, AppResourceType} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import checkEntitiesExist from '../checkEntitiesExist';
import checkPermissionOwnersExist from '../checkPermissionOwnersExist';
import checkResourcesExist from '../checkResourcesExist';
import {PermissionItemUtils} from '../utils';
import {internalReplacePermissionItemsByEntity} from './internalReplaceItemsByEntity';
import {ReplacePermissionItemsByEntityEndpoint} from './types';
import {replacePermissionItemsByEntityJoiSchema} from './validation';

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

    await checkEntitiesExist(context, agent, organization, [
      {
        permissionEntityId: data.permissionEntityId,
        permissionEntityType: data.permissionEntityType,
      },
    ]);

    await checkResourcesExist(context, agent, organization, data.items);
    await checkAuthorization({
      context,
      agent,
      organization,
      action: BasicCRUDActions.GrantPermission,
      type: AppResourceType.PermissionItem,
      permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
    });

    await checkPermissionOwnersExist(context, agent, organization, data.items);
    const items = await internalReplacePermissionItemsByEntity(
      context,
      agent,
      data
    );

    return {
      items: PermissionItemUtils.extractPublicPermissionItemList(items),
    };
  };

export default replacePermissionItemsByEntity;
