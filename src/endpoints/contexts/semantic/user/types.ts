import {User} from '../../../../definitions/user.js';
import {
  SemanticBaseProviderType,
  SemanticProviderOpParams,
  SemanticProviderQueryParams,
} from '../types.js';

export interface SemanticUserProviderType extends SemanticBaseProviderType<User> {
  getByEmail(
    email: string,
    opts?: SemanticProviderQueryParams<User>
  ): Promise<User | null>;
  existsByEmail(email: string, opts?: SemanticProviderOpParams): Promise<boolean>;
}
