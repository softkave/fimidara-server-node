import {AgentToken} from '../../definitions/agentToken';
import {TokenAccessScope} from '../../definitions/system';
import {DataProviderFilterValueOperator} from '../contexts/data/DataProvider';
import DataProviderFilterBuilder from '../contexts/data/DataProviderFilterBuilder';
import EndpointReusableQueries from '../queries';

function newFilter() {
  return new DataProviderFilterBuilder<AgentToken>();
}

function getByUserIdAndTokenAccessScope(userId: string, tokenAccessScope: TokenAccessScope) {
  return newFilter()
    .addItem('separateEntityId', userId, DataProviderFilterValueOperator.Equal)
    .addItem('scope', tokenAccessScope, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class UserTokenQueries {
  static getById = EndpointReusableQueries.getByResourceId;
  static getByUserIdAndTokenAccessScope = getByUserIdAndTokenAccessScope;
}
