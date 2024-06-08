import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {getWorkspacePermissionGroupsQuery} from '../getWorkspacePermissionGroups/utils.js';
import {CountWorkspacePermissionGroupsEndpoint} from './types.js';
import {countWorkspacePermissionGroupsJoiSchema} from './validation.js';

const countWorkspacePermissionGroups: CountWorkspacePermissionGroupsEndpoint =
  async instData => {
    const data = validate(instData.data, countWorkspacePermissionGroupsJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        instData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const q = await getWorkspacePermissionGroupsQuery(agent, workspace);
    const count = await kSemanticModels
      .permissionGroup()
      .countManyByWorkspaceAndIdList(q);
    return {count};
  };

export default countWorkspacePermissionGroups;
