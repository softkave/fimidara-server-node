import {User} from '../../../definitions/user.js';
import {DataQuery} from '../../data/types.js';
import {
  SemanticBaseProvider,
  addIsDeletedIntoQuery,
} from '../SemanticBaseProvider.js';
import {
  SemanticProviderOpParams,
  SemanticProviderQueryParams,
} from '../types.js';
import {getIgnoreCaseDataQueryRegExp} from '../utils.js';
import {SemanticUserProviderType} from './types.js';

export class DataSemanticUser
  extends SemanticBaseProvider<User>
  implements SemanticUserProviderType
{
  async getByEmail(
    email: string,
    opts?: SemanticProviderQueryParams<User> | undefined
  ): Promise<User | null> {
    const query = addIsDeletedIntoQuery<DataQuery<User>>(
      {email: getIgnoreCaseDataQueryRegExp(email)},
      opts?.includeDeleted || false
    );

    return await this.data.getOneByQuery(query, opts);
  }

  async existsByEmail(
    email: string,
    opts?: SemanticProviderOpParams | undefined
  ): Promise<boolean> {
    const query = addIsDeletedIntoQuery<DataQuery<User>>(
      {email: getIgnoreCaseDataQueryRegExp(email)},
      opts?.includeDeleted || false
    );

    return await this.data.existsByQuery(query, opts);
  }

  async countUsersCreatedBetween(
    start: number,
    end: number,
    opts?: SemanticProviderQueryParams<User> | undefined
  ): Promise<number> {
    const query = addIsDeletedIntoQuery<DataQuery<User>>(
      {createdAt: {$gte: start, $lte: end}},
      opts?.includeDeleted || false
    );

    return await this.data.countByQuery(query, opts);
  }

  async getByOAuthUserId(
    oauthUserId: string,
    opts?: SemanticProviderQueryParams<User>
  ): Promise<User | null> {
    const query = addIsDeletedIntoQuery<DataQuery<User>>(
      {oauthUserId},
      opts?.includeDeleted || false
    );

    return await this.data.getOneByQuery(query, opts);
  }
}
