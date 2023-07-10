import {User} from '../../../../definitions/user';
import {SemanticDataAccessBaseProviderType, SemanticDataAccessProviderRunOptions} from '../types';

export interface SemanticDataAccessUserProviderType<TTxn>
  extends SemanticDataAccessBaseProviderType<User, TTxn> {
  getByEmail(email: string, opts?: SemanticDataAccessProviderRunOptions): Promise<User | null>;
  existsByEmail(email: string, opts?: SemanticDataAccessProviderRunOptions): Promise<boolean>;
}
