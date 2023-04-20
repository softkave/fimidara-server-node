import {File} from '../../definitions/file';
import {DataProviderFilterValueOperator} from '../contexts/data/DataProvider';
import DataProviderFilterBuilder from '../contexts/data/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<File>();
}

function getByNamePathAndExtention(workspaceId: string, namePath: string[], extension: string) {
  return newFilter()
    .addItem('namePath', namePath, DataProviderFilterValueOperator.Equal)
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem('extension', extension, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class FileQueries {
  static getByNamePathAndExtention = getByNamePathAndExtention;
}
