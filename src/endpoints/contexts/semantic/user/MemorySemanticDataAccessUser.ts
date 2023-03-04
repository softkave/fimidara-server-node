import {IUser} from '../../../../definitions/user';
import {SemanticDataAccessBaseProvider} from '../utils';
import {ISemanticDataAccessUserProvider} from './types';

export class MemorySemanticDataAccessUser
  extends SemanticDataAccessBaseProvider<IUser>
  implements ISemanticDataAccessUserProvider
{
  async getByEmail(email: string): Promise<IUser | null> {
    return this.memstore.readItem({email: {$regex: new RegExp(email, 'i')}});
  }

  async existsByEmail(email: string): Promise<boolean> {
    return !!(await this.getByEmail(email));
  }
}
