import {Workspace} from '../../../../definitions/workspace.js';
import {
  SemanticProviderOpParams,
  SemanticProviderQueryParams,
  SemanticWorkspaceResourceProviderType,
} from '../types.js';

export interface SemanticWorkspaceProviderType
  extends SemanticWorkspaceResourceProviderType<Workspace> {
  getByRootname(
    name: string,
    opts?: SemanticProviderQueryParams<Workspace>
  ): Promise<Workspace | null>;
  existsByRootname(name: string, opts?: SemanticProviderOpParams): Promise<boolean>;
  workspaceExistsByName(name: string, opts?: SemanticProviderOpParams): Promise<boolean>;
}
