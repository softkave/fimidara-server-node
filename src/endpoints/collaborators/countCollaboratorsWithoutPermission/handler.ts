import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {getPagedCollaboratorsWithoutPermission} from '../getCollaboratorsWithoutPermission/handler.js';
import {getWorkspaceCollaboratorsQuery} from '../getWorkspaceCollaborators/utils.js';
import {CountCollaboratorsWithoutPermissionEndpoint} from './types.js';
import {countCollaboratorsWithoutPermissionJoiSchema} from './validation.js';

const countCollaboratorsWithoutPermission: CountCollaboratorsWithoutPermissionEndpoint =
  async instData => {
    const data = validate(
      instData.data,
      countCollaboratorsWithoutPermissionJoiSchema
    );
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        instData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const assignedItemsQuery = await getWorkspaceCollaboratorsQuery(
      agent,
      workspace
    );
    const collaboratorIdList =
      await getPagedCollaboratorsWithoutPermission(assignedItemsQuery);
    const count = collaboratorIdList.length;
    return {count};
  };

export default countCollaboratorsWithoutPermission;
