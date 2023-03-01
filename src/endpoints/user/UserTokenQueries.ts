import {TokenFor} from '../../definitions/system';
import {IUserToken} from '../../definitions/userToken';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';
import {} from '../contexts/SessionContext';
import EndpointReusableQueries from '../queries';

function newFilter() {
  return new DataProviderFilterBuilder<IUserToken>();
}

function getByUserId(userId: string) {
  return newFilter().addItem('userId', userId, DataProviderFilterValueOperator.Equal).build();
}

function getByUserIdAndAudience(userId: string, audience: TokenFor) {
  return newFilter()
    .addItem('userId', userId, DataProviderFilterValueOperator.Equal)
    .addItem('audience', audience, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class UserTokenQueries {
  static getById = EndpointReusableQueries.getByResourceId;
  static getByUserId = getByUserId;
  static getByUserIdAndAudience = getByUserIdAndAudience;
}
