import {AssignedItem} from '../../../definitions/assignedItem';
import {kFimidaraResourceType} from '../../../definitions/system';
import {indexArray} from '../../../utils/indexArray';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {DataQuery} from '../../contexts/data/types';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {PaginationQuery} from '../../types';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {getWorkspaceCollaboratorsQuery} from '../getWorkspaceCollaborators/utils';
import {GetCollaboratorsWithoutPermissionEndpoint} from './types';
import {getCollaboratorsWithoutPermissionJoiSchema} from './validation';

const getCollaboratorsWithoutPermission: GetCollaboratorsWithoutPermissionEndpoint =
  async instData => {
    const data = validate(instData.data, getCollaboratorsWithoutPermissionJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        instData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
    const workspace = await checkWorkspaceExists(workspaceId);
    const assignedItemsQuery = await getWorkspaceCollaboratorsQuery(agent, workspace);
    const collaboratorIdList =
      await getPagedCollaboratorsWithoutPermission(assignedItemsQuery);

    return {collaboratorIds: collaboratorIdList};
  };

export default getCollaboratorsWithoutPermission;

export async function getPagedCollaboratorsWithoutPermission(
  assignedItemsQuery: DataQuery<AssignedItem>,
  page?: PaginationQuery
) {
  const assignedItems_collaborators = await kSemanticModels
    .assignedItem()
    .getManyByQuery(assignedItemsQuery, page);

  if (assignedItems_collaborators.length === 0) return [];

  // Check that collaborators do not have permission groups assigned
  let collaboratorIdList = assignedItems_collaborators.map(
    nextItem => nextItem.assigneeId
  );
  const assignedItems_permissionGroups = await kSemanticModels
    .assignedItem()
    .getManyByQuery(
      {
        assigneeId: {$in: collaboratorIdList},
        assignedItemType: kFimidaraResourceType.PermissionGroup,
      },
      page
    );
  const assignedItems_permissionGroupsMap = indexArray(assignedItems_permissionGroups, {
    path: 'assigneeId',
  });
  collaboratorIdList = collaboratorIdList.filter(
    nextId => !assignedItems_permissionGroupsMap[nextId]
  );

  // TODO: that they have permission groups do not mean they have permission

  // Check that collaborators do not have permission items assigned
  const permissionItems = await kSemanticModels.permissionItem().getManyByQuery({
    entityId: {$in: collaboratorIdList},
  });
  const permissionItemsMap = indexArray(permissionItems, {path: 'entityId'});
  collaboratorIdList = collaboratorIdList.filter(nextId => !permissionItemsMap[nextId]);

  return collaboratorIdList;
}
