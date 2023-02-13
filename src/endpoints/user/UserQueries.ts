import {IUser} from '../../definitions/user';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';
import EndpointReusableQueries from '../queries';

function newFilter() {
  return new DataProviderFilterBuilder<IUser>();
}

function getByEmail(email: string) {
  return newFilter()
    .addItem('email', new RegExp(`^${email}$`, 'i'), DataProviderFilterValueOperator.Regex)
    .build();
}

function userExists(email: string) {
  return newFilter()
    .addItem('email', new RegExp(`^${email}$`, 'i'), DataProviderFilterValueOperator.Regex)
    .build();
}

export default abstract class UserQueries {
  static getById = EndpointReusableQueries.getByResourceId;
  static getByIds = EndpointReusableQueries.getByResourceIdList;
  static userExists = userExists;
  static getByEmail = getByEmail;
}
