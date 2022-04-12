import {IUser} from '../../definitions/user';
import {DataProviderFilterValueOperator} from '../contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from '../contexts/data-providers/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IUser>();
}

function getByWorkspaceId(workspaceId: string) {
  return newFilter()
    .addItemWithStringKey(
      'workspaces.workspaceId',
      workspaceId,
      DataProviderFilterValueOperator.Equal
    )
    .build();
}

function getByWorkspaceIdAndUserEmail(workspaceId: string, userEmail: string) {
  return newFilter()
    .addItemWithStringKey(
      'workspaces.workspaceId',
      workspaceId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'email',
      new RegExp(`^${userEmail}$`, 'i'),
      DataProviderFilterValueOperator.Regex
    )
    .build();
}

function getByUserEmail(userEmail: string) {
  return newFilter()
    .addItem(
      'email',
      new RegExp(`^${userEmail}$`, 'i'),
      DataProviderFilterValueOperator.Regex
    )
    .build();
}

function getByIds(ids: string[], workspaceId: string) {
  return newFilter()
    .addItem('resourceId', ids, DataProviderFilterValueOperator.In)
    .addItemWithStringKey(
      'workspaces.workspaceId',
      workspaceId,
      DataProviderFilterValueOperator.Equal
    )
    .build();
}

export default abstract class CollaboratorQueries {
  static getByWorkspaceId = getByWorkspaceId;
  static getByWorkspaceIdAndUserEmail = getByWorkspaceIdAndUserEmail;
  static getByUserEmail = getByUserEmail;
  static getByIds = getByIds;
}
