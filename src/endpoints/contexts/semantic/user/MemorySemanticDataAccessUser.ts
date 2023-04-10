import {IUser} from '../../../../definitions/user';
import {ISemanticDataAccessProviderRunOptions} from '../types';
import {SemanticDataAccessBaseProvider} from '../utils';
import {ISemanticDataAccessUserProvider} from './types';

export class MemorySemanticDataAccessUser
  extends SemanticDataAccessBaseProvider<IUser>
  implements ISemanticDataAccessUserProvider
{
  async getByEmail(
    email: string,
    opts?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<IUser | null> {
    return await this.memstore.readItem({email: {$lowercaseEq: email}}, opts?.transaction);
  }

  async existsByEmail(
    email: string,
    opts?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<boolean> {
    return await this.memstore.exists({email: {$lowercaseEq: email}}, opts?.transaction);
  }
}
