import {User} from '../../../../definitions/user';
import {DataSemanticBaseProvider} from '../DataSemanticDataAccessBaseProvider';
import {SemanticProviderTxnOptions} from '../types';
import {getIgnoreCaseDataQueryRegExp} from '../utils';
import {SemanticUserProviderType} from './types';

export class DataSemanticUser
  extends DataSemanticBaseProvider<User>
  implements SemanticUserProviderType
{
  async getByEmail(
    email: string,
    opts?: SemanticProviderTxnOptions | undefined
  ): Promise<User | null> {
    return await this.data.getOneByQuery(
      {email: getIgnoreCaseDataQueryRegExp(email)},
      opts
    );
  }

  async existsByEmail(
    email: string,
    opts?: SemanticProviderTxnOptions | undefined
  ): Promise<boolean> {
    return await this.data.existsByQuery(
      {email: getIgnoreCaseDataQueryRegExp(email)},
      opts
    );
  }
}
