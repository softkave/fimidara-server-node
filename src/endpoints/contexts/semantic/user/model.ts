import {User} from '../../../../definitions/user.js';
import {DataQuery} from '../../data/types.js';
import {
  DataSemanticBaseProvider,
  addIsDeletedIntoQuery,
} from '../DataSemanticDataAccessBaseProvider.js';
import {SemanticProviderOpParams, SemanticProviderQueryParams} from '../types.js';
import {getIgnoreCaseDataQueryRegExp} from '../utils.js';
import {SemanticUserProviderType} from './types.js';

export class DataSemanticUser
  extends DataSemanticBaseProvider<User>
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
}
