import {compact} from 'lodash';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {
  checkAuthorization,
  getWorkspacePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {getWorkspaceIdFromSessionAgent} from '../../contexts/SessionContext';
import {checkWorkspaceExists} from '../../workspaces/utils';
import checkEntitiesExist from '../checkEntitiesExist';
import checkPermissionContainersExist from '../checkPermissionContainersExist';
import checkPermissionTargetsExist from '../checkResourcesExist';
import {PermissionItemUtils} from '../utils';
import {ReplacePermissionItemsByEntityEndpoint} from './types';
import {internalFunctionReplacePermissionItemsByEntity} from './utils';
import {replacePermissionItemsByEntityJoiSchema} from './validation';

const replacePermissionItemsByEntity: ReplacePermissionItemsByEntityEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, replacePermissionItemsByEntityJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkEntitiesExist(context, agent, workspace, [data.entityId]);
  await checkPermissionTargetsExist(
    context,
    agent,
    workspace,
    compact(data.items.map(item => item.targetId))
  );
  await checkAuthorization({
    context,
    agent,
    workspace,
    action: BasicCRUDActions.Create,
    type: AppResourceType.PermissionItem,
    permissionContainers: getWorkspacePermissionContainers(workspace.resourceId),
  });
  await checkPermissionContainersExist(context, agent, workspace, data.items);
  const items = await internalFunctionReplacePermissionItemsByEntity(context, agent, data);
  return {
    items: PermissionItemUtils.extractPublicPermissionItemList(items),
  };
};

export default replacePermissionItemsByEntity;
