import {extractResourceIdList} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kUtilsInjectables, kSemanticModels} from '../../contexts/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {PermissionItemUtils, getPermissionItemTargets} from '../utils';
import {GetResourcePermissionItemsEndpoint} from './types';
import {getResourcePermissionItemsJoiSchema} from './validation';

// TODO: Support fetching permission items that touch target type without target
// ID
// TODO: Support fetching permission items that are specific to the query not
// just all permissions that touch it
// TODO: Look into adding endpoint for fetching permission items for a containers

const getResourcePermissionItems: GetResourcePermissionItemsEndpoint = async instData => {
  const data = validate(instData.data, getResourcePermissionItemsJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'updatePermission', targetId: workspace.resourceId},
  });

  const targets = await getPermissionItemTargets(agent, workspace, data.target);
  const targetIdList = targets.length ? extractResourceIdList(targets) : undefined;
  const permissionItems = await kSemanticModels.permissions().getPermissionItems({
    targetId: targetIdList,
  });
  return {
    items: PermissionItemUtils.extractPublicPermissionItemList(permissionItems),
  };
};

export default getResourcePermissionItems;
