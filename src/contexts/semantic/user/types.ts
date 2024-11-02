import {User} from '../../../definitions/user.js';
import {
  SemanticProviderOpParams,
  SemanticProviderQueryParams,
  SemanticWorkspaceResourceProviderType,
} from '../types.js';

export interface SemanticUserProviderType
  extends SemanticWorkspaceResourceProviderType<User> {
  getByEmail(
    params: {email: string; workspaceId?: string},
    opts?: SemanticProviderQueryParams<User>
  ): Promise<User | null>;
  getByUserId(
    params: {userId: string; workspaceId?: string},
    opts?: SemanticProviderQueryParams<User>
  ): Promise<User | null>;
  countUsersCreatedBetween(
    start: number,
    end: number,
    opts?: SemanticProviderQueryParams<User>
  ): Promise<number>;
  existsByEmail(
    params: {email: string; workspaceId?: string},
    opts?: SemanticProviderOpParams
  ): Promise<boolean>;
}
