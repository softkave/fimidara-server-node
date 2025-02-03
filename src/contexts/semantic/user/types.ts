import {User} from '../../../definitions/user.js';
import {
  SemanticBaseProviderType,
  SemanticProviderOpParams,
  SemanticProviderQueryParams,
} from '../types.js';

export interface SemanticUserProviderType
  extends SemanticBaseProviderType<User> {
  getByEmail(
    email: string,
    opts?: SemanticProviderQueryParams<User>
  ): Promise<User | null>;
  countUsersCreatedBetween(
    start: number,
    end: number,
    opts?: SemanticProviderQueryParams<User>
  ): Promise<number>;
  existsByEmail(
    email: string,
    opts?: SemanticProviderOpParams
  ): Promise<boolean>;
  getByOAuthUserId(
    oauthUserId: string,
    opts?: SemanticProviderQueryParams<User>
  ): Promise<User | null>;
}
