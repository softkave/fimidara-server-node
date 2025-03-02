import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {getWorkspacePermissionGroupsQuery} from '../getWorkspacePermissionGroups/utils.js';
import {CountWorkspacePermissionGroupsEndpoint} from './types.js';
import {countWorkspacePermissionGroupsJoiSchema} from './validation.js';

const countWorkspacePermissionGroups: CountWorkspacePermissionGroupsEndpoint =
  async reqData => {
    const data = validate(
      reqData.data,
      countWorkspacePermissionGroupsJoiSchema
    );
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const q = await getWorkspacePermissionGroupsQuery(agent, workspace);
    const count = await kIjxSemantic
      .permissionGroup()
      .countManyByWorkspaceAndIdList(q);
    return {count};
  };

export default countWorkspacePermissionGroups;
