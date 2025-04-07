import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
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
  const user = await kIjxUtils
    .session()
    .getUser(reqData, kSessionUtils.accessScopes.user);
  applyDefaultEndpointPaginationOptions(data);
  const assignedItems = await kIjxSemantic
    .assignedItem()
    .getUserWorkspaces(user.resourceId, data);
  const workspaceIdList = assignedItems.map(item => item.assignedItemId);
  const workspaces = await kIjxSemantic
    .workspace()
    .getManyByIdList(workspaceIdList);
  return {
    page: getEndpointPageFromInput(data),
    workspaces: workspaceListExtractor(workspaces),
  };
};

export default getUserWorkspaces;
