import {User} from '../../../../definitions/user';
import {DataQuery} from '../../data/types';
import {
  DataSemanticBaseProvider,
  addIsDeletedIntoQuery,
} from '../DataSemanticDataAccessBaseProvider';
import {SemanticProviderOpParams, SemanticProviderQueryParams} from '../types';
import {getIgnoreCaseDataQueryRegExp} from '../utils';
import {SemanticUserProviderType} from './types';

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
