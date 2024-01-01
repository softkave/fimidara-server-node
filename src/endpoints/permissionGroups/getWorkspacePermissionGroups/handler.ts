import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {permissionGroupListExtractor} from '../utils';
import {GetWorkspacePermissionGroupsEndpoint} from './types';
import {getWorkspacePermissionGroupsQuery} from './utils';
import {getWorkspacePermissionGroupsJoiSchema} from './validation';

const getWorkspacePermissionGroups: GetWorkspacePermissionGroupsEndpoint =
  async instData => {
    const data = validate(instData.data, getWorkspacePermissionGroupsJoiSchema);
    const agent = await kUtilsInjectables.session().getAgent(instData);
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const q = await getWorkspacePermissionGroupsQuery(agent, workspace);
    applyDefaultEndpointPaginationOptions(data);
    const items = await kSemanticModels
      .permissionGroup()
      .getManyByWorkspaceAndIdList(q, data);
    return {
      page: getEndpointPageFromInput(data),
      permissionGroups: permissionGroupListExtractor(items),
    };
  };

export default getWorkspacePermissionGroups;
