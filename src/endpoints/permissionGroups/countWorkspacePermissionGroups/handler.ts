import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getWorkspacePermissionGroupsQuery} from '../getWorkspacePermissionGroups/utils';
import {CountWorkspacePermissionGroupsEndpoint} from './types';
import {countWorkspacePermissionGroupsJoiSchema} from './validation';

const countWorkspacePermissionGroups: CountWorkspacePermissionGroupsEndpoint =
  async instData => {
    const data = validate(instData.data, countWorkspacePermissionGroupsJoiSchema);
    const agent = await kUtilsInjectables.session().getAgent(instData);
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const q = await getWorkspacePermissionGroupsQuery(agent, workspace);
    const count = await kSemanticModels
      .permissionGroup()
      .countManyByWorkspaceAndIdList(q);
    return {count};
  };

export default countWorkspacePermissionGroups;
