import {IUser} from '../../definitions/user';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IUser>();
}

function getByUserEmail(userEmail: string) {
  return newFilter()
    .addItem('email', new RegExp(`^${userEmail}$`, 'i'), DataProviderFilterValueOperator.Regex)
    .build();
}

export default abstract class CollaboratorQueries {
  static getByUserEmail = getByUserEmail;
}
