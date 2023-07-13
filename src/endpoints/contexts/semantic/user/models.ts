import {User} from '../../../../definitions/user';
import {getLowercaseRegExpForString} from '../../../../utils/fns';
import {DataSemanticDataAccessBaseProvider} from '../DataSemanticDataAccessBaseProvider';
import {SemanticDataAccessProviderRunOptions} from '../types';
import {SemanticDataAccessUserProviderType} from './types';

export class DataSemanticDataAccessUser
  extends DataSemanticDataAccessBaseProvider<User>
  implements SemanticDataAccessUserProviderType
{
  async getByEmail(
    email: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<User | null> {
    return await this.data.getOneByQuery(
      {email: {$regex: getLowercaseRegExpForString(email)}},
      opts
    );
  }

  async existsByEmail(
    email: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<boolean> {
    return await this.data.existsByQuery(
      {email: {$regex: getLowercaseRegExpForString(email)}},
      opts
    );
  }
}
