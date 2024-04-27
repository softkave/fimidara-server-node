import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getWorkspacePermissionGroupsQuery} from '../getWorkspacePermissionGroups/utils';
import {CountWorkspacePermissionGroupsEndpoint} from './types';
import {countWorkspacePermissionGroupsJoiSchema} from './validation';

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
