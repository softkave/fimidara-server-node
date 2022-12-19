import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {checkWorkspaceExists} from '../../workspaces/utils';
import checkEntitiesExist from '../checkEntitiesExist';
import checkPermissionOwnersExist from '../checkPermissionOwnersExist';
import checkResourcesExist from '../checkResourcesExist';
import {PermissionItemUtils} from '../utils';
import {ReplacePermissionItemsByEntityEndpoint} from './types';
import {internalReplacePermissionItemsByEntity} from './utils';
import {replacePermissionItemsByEntityJoiSchema} from './validation';

const replacePermissionItemsByEntity: ReplacePermissionItemsByEntityEndpoint =
  async (context, instData) => {
    const data = validate(
      instData.data,
      replacePermissionItemsByEntityJoiSchema
    );

    const agent = await context.session.getAgent(context, instData);
    const workspaceId = getWorkspaceId(agent, data.workspaceId);
    const workspace = await checkWorkspaceExists(context, workspaceId);
    await checkEntitiesExist(context, agent, workspace, [
      {
        permissionEntityId: data.permissionEntityId,
        permissionEntityType: data.permissionEntityType,
      },
    ]);

    await checkResourcesExist(context, agent, workspace, data.items);
    await checkAuthorization({
      context,
      agent,
      workspace,
      action: BasicCRUDActions.GrantPermission,
      type: AppResourceType.PermissionItem,
      permissionOwners: makeWorkspacePermissionOwnerList(workspace.resourceId),
    });

    await checkPermissionOwnersExist(context, agent, workspace, data.items);
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
