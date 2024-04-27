import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getPagedCollaboratorsWithoutPermission} from '../getCollaboratorsWithoutPermission/handler';
import {getWorkspaceCollaboratorsQuery} from '../getWorkspaceCollaborators/utils';
import {CountCollaboratorsWithoutPermissionEndpoint} from './types';
import {countCollaboratorsWithoutPermissionJoiSchema} from './validation';

const countCollaboratorsWithoutPermission: CountCollaboratorsWithoutPermissionEndpoint =
  async instData => {
    const data = validate(instData.data, countCollaboratorsWithoutPermissionJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        instData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const assignedItemsQuery = await getWorkspaceCollaboratorsQuery(agent, workspace);
    const collaboratorIdList =
      await getPagedCollaboratorsWithoutPermission(assignedItemsQuery);
    const count = collaboratorIdList.length;
    return {count};
  };

export default countCollaboratorsWithoutPermission;
