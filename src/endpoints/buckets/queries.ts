import {IBucket} from '../../definitions/bucket';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/data-providers/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IBucket>();
}

function getById(id: string) {
  return newFilter()
    .addItem('bucketId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByEnvironmentId(id: string) {
  return newFilter()
    .addItem('environmentId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class BucketQueries {
  static getById = getById;
  static getByEnvironmentId = getByEnvironmentId;
}
