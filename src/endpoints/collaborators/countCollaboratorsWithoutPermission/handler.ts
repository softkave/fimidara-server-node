import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {getPagedCollaboratorsWithoutPermission} from '../getCollaboratorsWithoutPermission/handler.js';
import {getWorkspaceCollaboratorsQuery} from '../getWorkspaceCollaborators/utils.js';
import {CountCollaboratorsWithoutPermissionEndpoint} from './types.js';
import {countCollaboratorsWithoutPermissionJoiSchema} from './validation.js';

const countCollaboratorsWithoutPermission: CountCollaboratorsWithoutPermissionEndpoint =
  async reqData => {
    const data = validate(
      reqData.data,
      countCollaboratorsWithoutPermissionJoiSchema
    );
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
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
