import {uniq} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {DataQuery} from '../../../contexts/data/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {AssignedItem} from '../../../definitions/assignedItem.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {indexArray} from '../../../utils/indexArray.js';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {PaginationQuery} from '../../types.js';
import {checkWorkspaceExists} from '../../workspaces/utils.js';
import {getWorkspaceCollaboratorsQuery} from '../getWorkspaceCollaborators/utils.js';
import {GetCollaboratorsWithoutPermissionEndpoint} from './types.js';
import {getCollaboratorsWithoutPermissionJoiSchema} from './validation.js';

const getCollaboratorsWithoutPermission: GetCollaboratorsWithoutPermissionEndpoint =
  async reqData => {
    const data = validate(
      reqData.data,
      getCollaboratorsWithoutPermissionJoiSchema
    );
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
    const collaboratorIdList =
      await getPagedCollaboratorsWithoutPermission(assignedItemsQuery);

    return {collaboratorIds: collaboratorIdList};
  };

export default getCollaboratorsWithoutPermission;

export async function getPagedCollaboratorsWithoutPermission(
  assignedItemsQuery: DataQuery<AssignedItem>,
  page?: PaginationQuery
) {
  const assignedItems_collaborators = await kIjxSemantic
    .assignedItem()
    .getManyByQuery(assignedItemsQuery, page);

  if (assignedItems_collaborators.length === 0) {
    return [];
  }

  // Check that collaborators do not have permission groups assigned
  let collaboratorIdList = assignedItems_collaborators.map(
    nextItem => nextItem.assigneeId
  );
  const assignedItems_permissionGroups = await kIjxSemantic
    .assignedItem()
    .getManyByQuery(
      {
        assigneeId: {$in: collaboratorIdList},
        assignedItemType: kFimidaraResourceType.PermissionGroup,
      },
      page
    );
  const assignedItems_permissionGroupsMap = indexArray(
    assignedItems_permissionGroups,
    {path: 'assigneeId'}
  );
  collaboratorIdList = collaboratorIdList.filter(
    nextId => !assignedItems_permissionGroupsMap[nextId]
  );

  // TODO: that they have permission groups do not mean they have permission

  // Check that collaborators do not have permission items assigned
  const permissionItems = await kIjxSemantic.permissionItem().getManyByQuery({
    entityId: {$in: collaboratorIdList},
  });
  const permissionItemsMap = indexArray(permissionItems, {path: 'entityId'});
  collaboratorIdList = collaboratorIdList.filter(
    nextId => !permissionItemsMap[nextId]
  );

  collaboratorIdList = uniq(collaboratorIdList);
  return collaboratorIdList;
}
