import {Workspace} from '../../../../definitions/workspace';
import {
  SemanticDataAccessProviderRunOptions,
  SemanticDataAccessWorkspaceResourceProviderType,
} from '../types';

export interface SemanticDataAccessWorkspaceProviderType
  extends SemanticDataAccessWorkspaceResourceProviderType<Workspace> {
  getByRootname(
    name: string,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<Workspace | null>;
  existsByRootname(name: string, opts?: SemanticDataAccessProviderRunOptions): Promise<boolean>;
  workspaceExistsByName(
    name: string,
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<boolean>;
}
