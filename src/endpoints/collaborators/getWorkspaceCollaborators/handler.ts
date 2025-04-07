import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {UserWithWorkspace} from '../../../definitions/user.js';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {populateUserListWithWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {checkWorkspaceExists} from '../../workspaces/utils.js';
import {collaboratorListExtractor} from '../utils.js';
import {GetWorkspaceCollaboratorsEndpoint} from './types.js';
import {getWorkspaceCollaboratorsQuery} from './utils.js';
import {getWorkspaceCollaboratorsJoiSchema} from './validation.js';

const getWorkspaceCollaborators: GetWorkspaceCollaboratorsEndpoint =
  async reqData => {
    const data = validate(reqData.data, getWorkspaceCollaboratorsJoiSchema);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
    const workspace = await checkWorkspaceExists(workspaceId);
    const assignedItemsQuery = await getWorkspaceCollaboratorsQuery(
      agent,
      workspace
    );
    applyDefaultEndpointPaginationOptions(data);
    const assignedItems = await kIjxSemantic
      .assignedItem()
      .getManyByQuery(assignedItemsQuery, data);
    let usersWithWorkspaces: UserWithWorkspace[] = [];
    if (assignedItems.length > 0) {
      const userIdList = assignedItems.map(item => item.assigneeId);
      const users = await kIjxSemantic.user().getManyByIdList(userIdList);

      // TODO: only populate the calling workspace
      usersWithWorkspaces = await populateUserListWithWorkspaces(users);
    }

    return {
      page: getEndpointPageFromInput(data),
      collaborators: collaboratorListExtractor(
        usersWithWorkspaces,
        workspace.resourceId
      ),
    };
  };

export default getWorkspaceCollaborators;
