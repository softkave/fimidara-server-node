import {User} from '../../../../definitions/user';
import {ISemanticDataAccessBaseProvider, ISemanticDataAccessProviderRunOptions} from '../types';

export interface ISemanticDataAccessUserProvider extends ISemanticDataAccessBaseProvider<User> {
  getByEmail(email: string, opts?: ISemanticDataAccessProviderRunOptions): Promise<User | null>;
  existsByEmail(email: string, opts?: ISemanticDataAccessProviderRunOptions): Promise<boolean>;
}
