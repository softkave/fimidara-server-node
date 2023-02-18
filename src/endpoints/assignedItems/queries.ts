import {isArray, isUndefined} from 'lodash';
import {IAssignedItem, IAssignedItemMainFieldsMatcher} from '../../definitions/assignedItem';
import {AppResourceType} from '../../definitions/system';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IAssignedItem>();
}

function getByAssignedItem(workspaceId: string, assignedItemId: string) {
  const filter = newFilter()
    .addItem('assignedItemId', assignedItemId, DataProviderFilterValueOperator.Equal)
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal);
  return filter.build();
}

function getWorkspaceCollaborators(
  workspaceId: string,
  includedAssignedToItemIdList?: string[],
  excludedAssgignedToItemIdList?: string[]
) {
  const filter = newFilter()
    .addItem('assignedItemId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem('assignedItemType', AppResourceType.Workspace, DataProviderFilterValueOperator.Equal)
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem('assignedToItemType', AppResourceType.User, DataProviderFilterValueOperator.Equal);
  if (includedAssignedToItemIdList?.length) {
    filter.addItem(
      'assignedToItemId',
      includedAssignedToItemIdList,
      DataProviderFilterValueOperator.In
    );
  }
  if (excludedAssgignedToItemIdList?.length) {
    filter.addItem(
      'assignedToItemId',
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
  assignedToItemId: string | string[],
  assignedItemTypeList?: ReadonlyArray<AppResourceType>
) {
  const filter = newFilter();

  if (isArray(assignedToItemId)) {
    filter.addItem('assignedToItemId', assignedToItemId, DataProviderFilterValueOperator.In);
  } else {
    filter.addItem('assignedToItemId', assignedToItemId, DataProviderFilterValueOperator.Equal);
  }

  if (assignedItemTypeList) {
    filter.addItem('assignedItemType', assignedItemTypeList, DataProviderFilterValueOperator.In);
  }
  if (!isUndefined(workspaceId)) {
    filter.addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal);
  }

  return filter.build();
}

function getByMainFields(matcher: IAssignedItemMainFieldsMatcher) {
  const filter = newFilter()
    .addItem('assignedItemId', matcher.assignedItemId, DataProviderFilterValueOperator.Equal)
    .addItem('assignedToItemId', matcher.assignedToItemId, DataProviderFilterValueOperator.Equal)
    .addItem('workspaceId', matcher.workspaceId, DataProviderFilterValueOperator.Equal);
  return filter.build();
}

export default abstract class AssignedItemQueries {
  static getByAssignedToResource = getByAssignedToResource;
  static getByMainFields = getByMainFields;
  static getByAssignedItem = getByAssignedItem;
  static getWorkspaceCollaborators = getWorkspaceCollaborators;
}
