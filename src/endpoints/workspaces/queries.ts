import {IWorkspace} from '../../definitions/workspace';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';
import EndpointReusableQueries from '../queries';

function newFilter() {
  return new DataProviderFilterBuilder<IWorkspace>();
}

function getByName(name: string) {
  return newFilter()
    .addItem('name', new RegExp(`^${name}$`, 'i'), DataProviderFilterValueOperator.Regex)
    .build();
}

function getByRootname(name: string) {
  return newFilter().addItem('rootname', name, DataProviderFilterValueOperator.Equal).build();
}

export default abstract class WorkspaceQueries {
  static getById = EndpointReusableQueries.getById;
  static getByIds = EndpointReusableQueries.getByIds;
  static getByName = getByName;
  static getByRootname = getByRootname;
}
