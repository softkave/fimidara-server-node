import {IAssignedItem, IAssignedItemMainFieldsMatcher} from '../../definitions/assignedItem';
import {AppResourceType} from '../../definitions/system';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IAssignedItem>();
}

function getByAssignedItem(workspaceId: string, assignedItemId: string, assignedItemType: AppResourceType) {
  const filter = newFilter()
    .addItem('assignedItemId', assignedItemId, DataProviderFilterValueOperator.Equal)
    .addItem('assignedItemType', assignedItemType, DataProviderFilterValueOperator.Equal)
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal);
  return filter.build();
}

function getByAssignedToResource(
  // Use empty string for fetching user workspaces
  workspaceId: string,
  assignedToItemId: string,
  assignedToItemType: AppResourceType,
  assignedItemTypeList?: ReadonlyArray<AppResourceType>
) {
  const filter = newFilter()
    .addItem('assignedToItemId', assignedToItemId, DataProviderFilterValueOperator.Equal)
    .addItem('assignedToItemType', assignedToItemType, DataProviderFilterValueOperator.Equal);

  if (assignedItemTypeList) {
    filter.addItem('assignedItemType', assignedItemTypeList, DataProviderFilterValueOperator.In);
  }
  if (workspaceId && workspaceId !== '') {
    filter.addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal);
  }

  return filter.build();
}

function getByMainFields(matcher: IAssignedItemMainFieldsMatcher) {
  const filter = newFilter()
    .addItem('assignedItemId', matcher.assignedItemId, DataProviderFilterValueOperator.Equal)
    .addItem('assignedItemType', matcher.assignedItemType, DataProviderFilterValueOperator.Equal)
    .addItem('assignedToItemId', matcher.assignedToItemId, DataProviderFilterValueOperator.Equal)
    .addItem('assignedToItemType', matcher.assignedToItemType, DataProviderFilterValueOperator.Equal)
    .addItem('workspaceId', matcher.workspaceId, DataProviderFilterValueOperator.Equal);
  return filter.build();
}

export default abstract class AssignedItemQueries {
  static getByAssignedToResource = getByAssignedToResource;
  static getByMainFields = getByMainFields;
  static getByAssignedItem = getByAssignedItem;
}
