import {User} from '../../definitions/user';
import {DataProviderFilterValueOperator} from '../contexts/data/DataProvider';
import DataProviderFilterBuilder from '../contexts/data/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<User>();
}

function getByUserEmail(userEmail: string) {
  return newFilter()
    .addItem('email', new RegExp(`^${userEmail}$`, 'i'), DataProviderFilterValueOperator.Regex)
    .build();
}

export default abstract class CollaboratorQueries {
  static getByUserEmail = getByUserEmail;
}
