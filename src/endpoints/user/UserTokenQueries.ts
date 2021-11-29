import {IUserToken} from '../../definitions/userToken';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';
import {TokenAudience} from '../contexts/SessionContext';

function newFilter() {
  return new DataProviderFilterBuilder<IUserToken>();
}

function getById(id: string) {
  return newFilter()
    .addItem('tokenId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByUserId(userId: string) {
  return newFilter()
    .addItem('userId', userId, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByUserIdAndAudience(userId: string, audience: TokenAudience) {
  return newFilter()
    .addItem('userId', userId, DataProviderFilterValueOperator.Equal)
    .addItem('audience', audience, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class UserTokenQueries {
  static getById = getById;
  static getByUserId = getByUserId;
  static getByUserIdAndAudience = getByUserIdAndAudience;
}
