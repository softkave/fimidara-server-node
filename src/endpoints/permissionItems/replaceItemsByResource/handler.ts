import {IPermissionItem} from '../../../definitions/permissionItem';
import {validate} from '../../../utilities/validate';
import {checkOrganizationExists} from '../../organizations/utils';
import checkEntitiesExist from '../checkEntitiesExist';
import checkPermissionOwnersExist from '../checkPermissionOwnersExist';
import checkResourcesExist from '../checkResourcesExist';
import {PermissionItemUtils} from '../utils';
import {internalReplacePermissionItemsByResource} from './internalReplacePermissionItemsByResource';
import {ReplacePermissionItemsByResourceEndpoint} from './types';
import {replacePermissionItemsByResourceJoiSchema} from './validation';

const replacePermissionItemsByResource: ReplacePermissionItemsByResourceEndpoint =
  async (context, instData) => {
    const data = validate(
      instData.data,
      replacePermissionItemsByResourceJoiSchema
    );
    const agent = await context.session.getAgent(context, instData);
    const organization = await checkOrganizationExists(
      context,
      data.organizationId
    );

    await checkResourcesExist(context, agent, organization, [data]);
    await checkEntitiesExist(context, agent, organization, data.items);
    await checkPermissionOwnersExist(
      context,
      agent,
      organization,
      data.items.map(item => ({
        permissionOwnerId: item.permissionOwnerId,
        permissionOwnerType: item.permissionOwnerType,
      }))
    );

    const items: IPermissionItem[] =
      await internalReplacePermissionItemsByResource(context, agent, data);

    return {
      items: PermissionItemUtils.extractPublicPermissionItemList(items),
    };
  };

export default replacePermissionItemsByResource;
