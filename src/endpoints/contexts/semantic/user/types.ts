import {User} from '../../../../definitions/user';
import {SemanticDataAccessBaseProviderType, SemanticDataAccessProviderRunOptions} from '../types';

export interface SemanticDataAccessUserProviderType
  extends SemanticDataAccessBaseProviderType<User> {
  getByEmail(email: string, opts?: SemanticDataAccessProviderRunOptions): Promise<User | null>;
  existsByEmail(email: string, opts?: SemanticDataAccessProviderRunOptions): Promise<boolean>;
}
