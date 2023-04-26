import {Workspace} from '../../definitions/workspace';
import {DataProviderFilterValueOperator} from '../contexts/data/DataProvider';
import DataProviderFilterBuilder from '../contexts/data/DataProviderFilterBuilder';
import EndpointReusableQueries from '../queries';

function newFilter() {
  return new DataProviderFilterBuilder<Workspace>();
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
  static getById = EndpointReusableQueries.getByResourceId;
  static getByIds = EndpointReusableQueries.getByResourceIdList;
  static getByName = getByName;
  static getByRootname = getByRootname;
}
