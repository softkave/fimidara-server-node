import {AssignedItem} from '../../../definitions/assignedItem';
import {AppResourceType} from '../../../definitions/system';
import {indexArray} from '../../../utils/indexArray';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {LiteralDataQuery} from '../../contexts/data/types';
import {BaseContextType} from '../../contexts/types';
import {PaginationQuery} from '../../types';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {getWorkspaceCollaboratorsQuery} from '../getWorkspaceCollaborators/utils';
import {GetCollaboratorsWithoutPermissionEndpoint} from './types';
import {getCollaboratorsWithoutPermissionJoiSchema} from './validation';

const getCollaboratorsWithoutPermission: GetCollaboratorsWithoutPermissionEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getCollaboratorsWithoutPermissionJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  const assignedItemsQuery = await getWorkspaceCollaboratorsQuery(context, agent, workspace);
  const collaboratorIdList = await getPagedCollaboratorsWithoutPermission(
    context,
    assignedItemsQuery
  );

  return {collaboratorIds: collaboratorIdList};
};

export default getCollaboratorsWithoutPermission;

export async function getPagedCollaboratorsWithoutPermission(
  context: BaseContextType,
  assignedItemsQuery: LiteralDataQuery<AssignedItem>,
  page?: PaginationQuery
) {
  const assignedItems_collaborators = await context.semantic.assignedItem.getManyByQuery(
    assignedItemsQuery,
    page
  );

  if (assignedItems_collaborators.length === 0) return [];

  // Check that collaborators do not have permission groups assigned
  let collaboratorIdList = assignedItems_collaborators.map(nextItem => nextItem.assigneeId);
  const assignedItems_permissionGroups = await context.semantic.assignedItem.getManyByQuery(
    {
      assigneeId: {$in: collaboratorIdList},
      assignedItemType: AppResourceType.PermissionGroup,
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
  const permissionItems = await context.semantic.permissionItem.getManyByQuery({
    entityId: {$in: collaboratorIdList},
  });
  const permissionItemsMap = indexArray(permissionItems, {path: 'entityId'});
  collaboratorIdList = collaboratorIdList.filter(nextId => !permissionItemsMap[nextId]);

  return collaboratorIdList;
}
