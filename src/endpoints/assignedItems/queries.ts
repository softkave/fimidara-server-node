import {isArray, isUndefined} from 'lodash-es';
import {DataProviderFilterValueOperator} from '../../contexts/data/DataProvider.js';
import DataProviderFilterBuilder from '../../contexts/data/DataProviderFilterBuilder.js';
import {
  AssignedItem,
  AssignedItemMainFieldsMatcher,
} from '../../definitions/assignedItem.js';
import {
  FimidaraResourceType,
  kFimidaraResourceType,
} from '../../definitions/system.js';

function newFilter() {
  return new DataProviderFilterBuilder<AssignedItem>();
}

function getByAssignedItem(workspaceId: string, assignedItemId: string) {
  const filter = newFilter()
    .addItem(
      'assignedItemId',
      assignedItemId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal);
  return filter.build();
}

function getWorkspaceCollaborators(
  workspaceId: string,
  includedassigneeIdList?: string[],
  excludedAssgignedToItemIdList?: string[]
) {
  const filter = newFilter()
    .addItem(
      'assignedItemId',
      workspaceId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'assignedItemType',
      kFimidaraResourceType.Workspace,
      DataProviderFilterValueOperator.Equal
    )
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem(
      'assigneeType',
      kFimidaraResourceType.User,
      DataProviderFilterValueOperator.Equal
    );
  if (includedassigneeIdList?.length) {
    filter.addItem(
      'assigneeId',
      includedassigneeIdList,
      DataProviderFilterValueOperator.In
    );
  }
  if (excludedAssgignedToItemIdList?.length) {
    filter.addItem(
      'assigneeId',
      excludedAssgignedToItemIdList,
      DataProviderFilterValueOperator.NotIn
    );
  }
  return filter.build();
}

/**
 * @param workspaceId - Use `undefined` for fetching user workspaces
 */
function getByAssignedToResource(
  workspaceId: string | undefined,
  assigneeId: string | string[],
  assignedItemTypeList?: ReadonlyArray<FimidaraResourceType>
) {
  const filter = newFilter();

  if (isArray(assigneeId)) {
    filter.addItem(
      'assigneeId',
      assigneeId,
      DataProviderFilterValueOperator.In
    );
  } else {
    filter.addItem(
      'assigneeId',
      assigneeId,
      DataProviderFilterValueOperator.Equal
    );
  }

  if (assignedItemTypeList) {
    filter.addItem(
      'assignedItemType',
      assignedItemTypeList,
      DataProviderFilterValueOperator.In
    );
  }
  if (!isUndefined(workspaceId)) {
    filter.addItem(
      'workspaceId',
      workspaceId,
      DataProviderFilterValueOperator.Equal
    );
  }

  return filter.build();
}

function getByMainFields(matcher: AssignedItemMainFieldsMatcher) {
  const filter = newFilter()
    .addItem(
      'assignedItemId',
      matcher.assignedItemId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'assigneeId',
      matcher.assigneeId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'workspaceId',
      matcher.workspaceId,
      DataProviderFilterValueOperator.Equal
    );
  return filter.build();
}

export default abstract class AssignedItemQueries {
  static getByAssignedToResource = getByAssignedToResource;
  static getByMainFields = getByMainFields;
  static getByAssignedItem = getByAssignedItem;
  static getWorkspaceCollaborators = getWorkspaceCollaborators;
}
