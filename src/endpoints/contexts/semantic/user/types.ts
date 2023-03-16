import {IUser} from '../../../../definitions/user';
import {ISemanticDataAccessBaseProvider, ISemanticDataAccessProviderRunOptions} from '../types';

export interface ISemanticDataAccessUserProvider extends ISemanticDataAccessBaseProvider<IUser> {
  getByEmail(email: string, opts?: ISemanticDataAccessProviderRunOptions): Promise<IUser | null>;
  existsByEmail(email: string, opts?: ISemanticDataAccessProviderRunOptions): Promise<boolean>;
}
