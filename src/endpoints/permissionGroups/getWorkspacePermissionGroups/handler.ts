import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
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
  async reqData => {
    const data = validate(reqData.data, getWorkspacePermissionGroupsJoiSchema);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const q = await getWorkspacePermissionGroupsQuery(agent, workspace);
    applyDefaultEndpointPaginationOptions(data);
    const items = await kIjxSemantic
      .permissionGroup()
      .getManyByWorkspaceAndIdList(q, data);
    return {
      page: getEndpointPageFromInput(data),
      permissionGroups: permissionGroupListExtractor(items),
    };
  };

export default getWorkspacePermissionGroups;
