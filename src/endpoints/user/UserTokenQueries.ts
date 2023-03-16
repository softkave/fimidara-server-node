import {IAgentToken} from '../../definitions/agentToken';
import {TokenAccessScope} from '../../definitions/system';
import {DataProviderFilterValueOperator} from '../contexts/data/DataProvider';
import DataProviderFilterBuilder from '../contexts/data/DataProviderFilterBuilder';
import {} from '../contexts/SessionContext';
import EndpointReusableQueries from '../queries';

function newFilter() {
  return new DataProviderFilterBuilder<IAgentToken>();
}

function getByUserIdAndTokenAccessScope(userId: string, tokenAccessScope: TokenAccessScope) {
  return newFilter()
    .addItem('separateEntityId', userId, DataProviderFilterValueOperator.Equal)
    .addItem('accessScope', tokenAccessScope, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class UserTokenQueries {
  static getById = EndpointReusableQueries.getByResourceId;
  static getByUserIdAndTokenAccessScope = getByUserIdAndTokenAccessScope;
}
