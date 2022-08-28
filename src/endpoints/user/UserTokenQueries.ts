import {TokenAudience} from '../../definitions/system';
import {IUserToken} from '../../definitions/userToken';
import {DataProviderFilterValueOperator} from '../contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from '../contexts/data-providers/DataProviderFilterBuilder';
import {} from '../contexts/SessionContext';
import EndpointReusableQueries from '../queries';

function newFilter() {
  return new DataProviderFilterBuilder<IUserToken>();
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
  static getById = EndpointReusableQueries.getById;
  static getByUserId = getByUserId;
  static getByUserIdAndAudience = getByUserIdAndAudience;
}
