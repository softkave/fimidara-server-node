import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {permissionGroupListExtractor} from '../utils.js';
import {GetWorkspacePermissionGroupsEndpoint} from './types.js';
import {getWorkspacePermissionGroupsQuery} from './utils.js';
import {getWorkspacePermissionGroupsJoiSchema} from './validation.js';

const getWorkspacePermissionGroups: GetWorkspacePermissionGroupsEndpoint =
  async instData => {
    const data = validate(instData.data, getWorkspacePermissionGroupsJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        instData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
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
