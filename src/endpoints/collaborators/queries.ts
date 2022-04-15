import {IUser} from '../../definitions/user';
import {DataProviderFilterValueOperator} from '../contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from '../contexts/data-providers/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IUser>();
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

function getByIds(ids: string[]) {
  return newFilter()
    .addItem('resourceId', ids, DataProviderFilterValueOperator.In)
    .build();
}

export default abstract class CollaboratorQueries {
  static getByUserEmail = getByUserEmail;
  static getByIds = getByIds;
}
