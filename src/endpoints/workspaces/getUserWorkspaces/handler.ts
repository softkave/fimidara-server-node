import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {workspaceListExtractor} from '../utils';
import {GetUserWorkspacesEndpoint} from './types';
import {getUserWorkspacesJoiSchema} from './validation';

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
  const workspaces = await kSemanticModels.workspace().getManyByIdList(workspaceIdList);
  return {
    page: getEndpointPageFromInput(data),
    workspaces: workspaceListExtractor(workspaces),
  };
};

export default getUserWorkspaces;
