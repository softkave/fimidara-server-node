import {
  IAssignedItem,
  IAssignedItemMainFieldsMatcher,
} from '../../definitions/assignedItem';
import {AppResourceType} from '../../definitions/system';
import {DataProviderFilterValueOperator} from '../contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from '../contexts/data-providers/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IAssignedItem>();
}

function getByAssignedItem(
  organizationId: string,
  assignedItemId: string,
  assignedItemType: AppResourceType
) {
  const filter = newFilter()
    .addItem(
      'assignedItemId',
      assignedItemId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'assignedItemType',
      assignedItemType,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    );

  return filter.build();
}

function getByAssignedToResource(
  // Use empty string for fetching user organizations
  organizationId: string,
  assignedToItemId: string,
  assignedToItemType: AppResourceType,
  assignedItemType?: AppResourceType
) {
  const filter = newFilter()
    .addItem(
      'assignedToItemId',
      assignedToItemId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'assignedToItemType',
      assignedToItemType,
      DataProviderFilterValueOperator.Equal
    );

  if (assignedItemType) {
    filter.addItem(
      'assignedItemType',
      assignedItemType,
      DataProviderFilterValueOperator.Equal
    );
  }

  if (organizationId !== '') {
    filter.addItem(
      'organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    );
  }

  return filter.build();
}

function getByMainFields(matcher: IAssignedItemMainFieldsMatcher) {
  const filter = newFilter()
    .addItem(
      'assignedItemId',
      matcher.assignedItemId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'assignedItemType',
      matcher.assignedItemType,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'assignedToItemId',
      matcher.assignedToItemId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'assignedToItemType',
      matcher.assignedToItemType,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'organizationId',
      matcher.organizationId,
      DataProviderFilterValueOperator.Equal
    );

  return filter.build();
}

export default abstract class AssignedItemQueries {
  static getByAssignedToResource = getByAssignedToResource;
  static getByMainFields = getByMainFields;
  static getByAssignedItem = getByAssignedItem;
}
