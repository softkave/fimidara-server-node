import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {workspaceListExtractor} from '../utils.js';
import {GetUserWorkspacesEndpoint} from './types.js';
import {getUserWorkspacesJoiSchema} from './validation.js';

const getUserWorkspaces: GetUserWorkspacesEndpoint = async reqData => {
  const data = validate(reqData.data, getUserWorkspacesJoiSchema);
  const user = await kUtilsInjectables
    .session()
    .getUser(reqData, kSessionUtils.accessScopes.user);
  applyDefaultEndpointPaginationOptions(data);
  const assignedItems = await kSemanticModels
    .assignedItem()
    .getUserWorkspaces(user.resourceId, data);
  const workspaceIdList = assignedItems.map(item => item.assignedItemId);
  const workspaces = await kSemanticModels
    .workspace()
    .getManyByIdList(workspaceIdList);
  return {
    page: getEndpointPageFromInput(data),
    workspaces: workspaceListExtractor(workspaces),
  };
};

export default getUserWorkspaces;
