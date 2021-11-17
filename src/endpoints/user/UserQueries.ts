import {IUser} from '../../definitions/user';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IUser>();
}

function getById(id: string) {
  return newFilter()
    .addItem('userId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByIds(ids: string[]) {
  return newFilter()
    .addItem('userId', ids, DataProviderFilterValueOperator.In)
    .build();
}

function userExists(email: string) {
  return newFilter()
    .addItem('email', email, DataProviderFilterValueOperator.Regex)
    .build();
}

export default abstract class UserQueries {
  static getById = getById;
  static getByIds = getByIds;
  static userExists = userExists;
}
