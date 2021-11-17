import {IEnvironment} from '../../definitions/environment';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IEnvironment>();
}

function getById(id: string) {
  return newFilter()
    .addItem('environmentId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByName(name: string, parent?: IEnvironment) {
  const filter: DataProviderFilterBuilder<IEnvironment> = newFilter().addItem(
    'name',
    name,
    DataProviderFilterValueOperator.Equal
  );

  if (parent) {
    filter.addItem(
      'parentId',
      parent.environmentId,
      DataProviderFilterValueOperator.Equal
    );
  } else {
    filter.addItem('parentId', null, DataProviderFilterValueOperator.Equal);
  }

  return filter.build();
}

function environmentExists(
  bucketId: string,
  parentId: string | null | undefined,
  name: string
) {
  return newFilter()
    .addItem('bucketId', bucketId, DataProviderFilterValueOperator.Equal)
    .addItem('parentId', parentId, DataProviderFilterValueOperator.Equal)
    .addItem('name', name, DataProviderFilterValueOperator.Equal)
    .build();
}

function getEnvironmentsByParentId(parentId: string) {
  return newFilter()
    .addItem('parentId', parentId, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByOrganizationId(organizationId: string) {
  return newFilter()
    .addItem(
      'organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .build();
}

export default abstract class EnvironmentQueries {
  static getById = getById;
  static getByName = getByName;
  static environmentExists = environmentExists;
  static getEnvironmentsByParentId = getEnvironmentsByParentId;
  static getByOrganizationId = getByOrganizationId;
}
