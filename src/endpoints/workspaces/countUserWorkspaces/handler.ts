import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {CountUserWorkspacesEndpoint} from './types';

const countUserWorkspaces: CountUserWorkspacesEndpoint = async d => {
  const user = await kUtilsInjectables.session().getUser(d);
  const assignedItems = await kSemanticModels
    .assignedItem()
    .getUserWorkspaces(user.resourceId);
  const workspaceIdList = assignedItems.map(item => item.assignedItemId);
  const count = await kSemanticModels.workspace().countManyByIdList(workspaceIdList);
  return {count};
};

export default countUserWorkspaces;
