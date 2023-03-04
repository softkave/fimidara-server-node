import {TokenAccessScope} from '../../definitions/system';
import {IUserToken} from '../../definitions/userToken';
import {DataProviderFilterValueOperator} from '../contexts/data/DataProvider';
import DataProviderFilterBuilder from '../contexts/data/DataProviderFilterBuilder';
import {} from '../contexts/SessionContext';
import EndpointReusableQueries from '../queries';

function newFilter() {
  return new DataProviderFilterBuilder<IUserToken>();
}

function getByUserId(userId: string) {
  return newFilter().addItem('userId', userId, DataProviderFilterValueOperator.Equal).build();
}

function getByUserIdAndTokenAccessScope(userId: string, tokenAccessScope: TokenAccessScope) {
  return newFilter()
    .addItem('userId', userId, DataProviderFilterValueOperator.Equal)
    .addItem('tokenAccessScope', tokenAccessScope, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class UserTokenQueries {
  static getById = EndpointReusableQueries.getByResourceId;
  static getByUserId = getByUserId;
  static getByUserIdAndTokenAccessScope = getByUserIdAndTokenAccessScope;
}
