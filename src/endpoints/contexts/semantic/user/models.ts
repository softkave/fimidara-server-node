import {User} from '../../../../definitions/user';
import {getIgnoreCaseRegExpForString} from '../../../../utils/fns';
import {DataSemanticBaseProvider} from '../DataSemanticDataAccessBaseProvider';
import {SemanticProviderRunOptions} from '../types';
import {SemanticUserProviderType} from './types';

export class DataSemanticUser
  extends DataSemanticBaseProvider<User>
  implements SemanticUserProviderType
{
  async getByEmail(
    email: string,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<User | null> {
    return await this.data.getOneByQuery(
      {email: {$regex: getIgnoreCaseRegExpForString(email)}},
      opts
    );
  }

  async existsByEmail(
    email: string,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<boolean> {
    return await this.data.existsByQuery(
      {email: {$regex: getIgnoreCaseRegExpForString(email)}},
      opts
    );
  }
}
