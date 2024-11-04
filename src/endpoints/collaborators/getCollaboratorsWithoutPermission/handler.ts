import {uniq} from 'lodash-es';
import {DataQuery} from '../../../contexts/data/types.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {AssignedItem} from '../../../definitions/assignedItem.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {indexArray} from '../../../utils/indexArray.js';
import {validate} from '../../../utils/validate.js';
import {PaginationQuery} from '../../types.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getCollaboratorsQuery} from '../getCollaborators/utils.js';
import {GetCollaboratorsWithoutPermissionEndpoint} from './types.js';
import {getCollaboratorsWithoutPermissionJoiSchema} from './validation.js';

export async function getPagedCollaboratorsWithoutPermission(
  assignedItemsQuery: DataQuery<AssignedItem>,
  page?: PaginationQuery
) {
  const assignedItems_collaborators = await kSemanticModels
    .assignedItem()
    .getManyByQuery(assignedItemsQuery, page);

  if (assignedItems_collaborators.length === 0) {
    return [];
  }

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
  const assignedItems_permissionGroupsMap = indexArray(
    assignedItems_permissionGroups,
    {path: 'assigneeId'}
  );
  collaboratorIdList = collaboratorIdList.filter(
    nextId => !assignedItems_permissionGroupsMap[nextId]
  );

  // TODO: that they have permission groups do not mean they have permission

  // Check that collaborators do not have permission items assigned
  const permissionItems = await kSemanticModels
    .permissionItem()
    .getManyByQuery({
      entityId: {$in: collaboratorIdList},
    });
  const permissionItemsMap = indexArray(permissionItems, {path: 'entityId'});
  collaboratorIdList = collaboratorIdList.filter(
    nextId => !permissionItemsMap[nextId]
  );

  collaboratorIdList = uniq(collaboratorIdList);
  return collaboratorIdList;
}

const getCollaboratorsWithoutPermissionEndpoint: GetCollaboratorsWithoutPermissionEndpoint =
  async reqData => {
    const data = validate(
      reqData.data,
      getCollaboratorsWithoutPermissionJoiSchema
    );
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    const assignedItemsQuery = await getCollaboratorsQuery(agent, workspaceId);
    const collaboratorIdList =
      await getPagedCollaboratorsWithoutPermission(assignedItemsQuery);

    return {collaboratorIds: collaboratorIdList};
  };

export default getCollaboratorsWithoutPermissionEndpoint;
