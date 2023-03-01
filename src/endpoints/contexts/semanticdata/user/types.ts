import {IUser} from '../../../../definitions/user';
import {ISemanticDataAccessBaseProvider} from '../types';

export interface ISemanticDataAccessUserProvider extends ISemanticDataAccessBaseProvider<IUser> {
  getByEmail(email: string): Promise<IUser | null>;
  existsByEmail(email: string): Promise<boolean>;
}
