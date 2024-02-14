import {User} from '../../../../definitions/user';
import {SemanticBaseProviderType, SemanticProviderTxnOptions} from '../types';

export interface SemanticUserProviderType extends SemanticBaseProviderType<User> {
  getByEmail(email: string, opts?: SemanticProviderTxnOptions): Promise<User | null>;
  existsByEmail(email: string, opts?: SemanticProviderTxnOptions): Promise<boolean>;
}
