import {User} from '../../../../definitions/user';
import {SemanticBaseProviderType, SemanticProviderRunOptions} from '../types';

export interface SemanticUserProviderType extends SemanticBaseProviderType<User> {
  getByEmail(email: string, opts?: SemanticProviderRunOptions): Promise<User | null>;
  existsByEmail(email: string, opts?: SemanticProviderRunOptions): Promise<boolean>;
}
