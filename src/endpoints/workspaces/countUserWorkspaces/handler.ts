import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {CountUserWorkspacesEndpoint} from './types.js';

const countUserWorkspaces: CountUserWorkspacesEndpoint = async reqData => {
  const user = await kUtilsInjectables
    .session()
    .getUser(reqData, kSessionUtils.accessScopes.user);
  const assignedItems = await kSemanticModels
    .assignedItem()
    .getUserWorkspaces(user.resourceId);
  const workspaceIdList = assignedItems.map(item => item.assignedItemId);
  const count = await kSemanticModels
    .workspace()
    .countManyByIdList(workspaceIdList);
  return {count};
};

export default countUserWorkspaces;
