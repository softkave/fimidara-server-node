import {User} from '../../../../definitions/user';
import {ISemanticDataAccessProviderRunOptions} from '../types';
import {SemanticDataAccessBaseProvider} from '../utils';
import {ISemanticDataAccessUserProvider} from './types';

export class MemorySemanticDataAccessUser
  extends SemanticDataAccessBaseProvider<User>
  implements ISemanticDataAccessUserProvider
{
  async getByEmail(
    email: string,
    opts?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<User | null> {
    return await this.memstore.readItem({email: {$lowercaseEq: email}}, opts?.transaction);
  }

  async existsByEmail(
    email: string,
    opts?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<boolean> {
    return await this.memstore.exists({email: {$lowercaseEq: email}}, opts?.transaction);
  }
}
