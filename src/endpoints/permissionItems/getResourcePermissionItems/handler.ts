import {extractResourceIdList} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {PermissionItemUtils, getPermissionItemTargets} from '../utils';
import {GetResourcePermissionItemsEndpoint} from './types';
import {getResourcePermissionItemsJoiSchema} from './validation';

// TODO: Support fetching permission items that touch target type without target
// ID
// TODO: Support fetching permission items that are specific to the query not
// just all permissions that touch it
// TODO: Look into adding endpoint for fetching permission items for a containers

const getResourcePermissionItems: GetResourcePermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getResourcePermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkAuthorizationWithAgent({
    context,
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'updatePermission', targetId: workspace.resourceId},
  });

  const targets = await getPermissionItemTargets(context, agent, workspace, data.target);
  const targetIdList = targets.length ? extractResourceIdList(targets) : undefined;
  const permissionItems = await context.semantic.permissions.getPermissionItems({
    context,
    targetId: targetIdList,
  });
  return {
    items: PermissionItemUtils.extractPublicPermissionItemList(permissionItems),
  };
};

export default getResourcePermissionItems;
