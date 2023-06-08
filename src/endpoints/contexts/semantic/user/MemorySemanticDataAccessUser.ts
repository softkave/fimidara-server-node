import {User} from '../../../../definitions/user';
import {SemanticDataAccessProviderRunOptions} from '../types';
import {SemanticDataAccessBaseProvider} from '../utils';
import {SemanticDataAccessUserProviderType} from './types';

export class MemorySemanticDataAccessUser
  extends SemanticDataAccessBaseProvider<User>
  implements SemanticDataAccessUserProviderType
{
  async getByEmail(
    email: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<User | null> {
    return await this.memstore.readItem({email: {$lowercaseEq: email}}, opts?.transaction);
  }

  async existsByEmail(
    email: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<boolean> {
    return await this.memstore.exists({email: {$lowercaseEq: email}}, opts?.transaction);
  }
}
