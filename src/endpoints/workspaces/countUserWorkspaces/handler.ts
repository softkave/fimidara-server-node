import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {CountUserWorkspacesEndpoint} from './types.js';

const countUserWorkspaces: CountUserWorkspacesEndpoint = async reqData => {
  const user = await kIjxUtils
    .session()
    .getUser(reqData, kSessionUtils.accessScopes.user);
  const assignedItems = await kIjxSemantic
    .assignedItem()
    .getUserWorkspaces(user.resourceId);
  const workspaceIdList = assignedItems.map(item => item.assignedItemId);
  const count = await kIjxSemantic
    .workspace()
    .countManyByIdList(workspaceIdList);
  return {count};
};

export default countUserWorkspaces;
