import {Workspace} from '../../../../definitions/workspace';
import {
  SemanticProviderRunOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticWorkspaceProviderType
  extends SemanticWorkspaceResourceProviderType<Workspace> {
  getByRootname(
    name: string,
    opts?: SemanticProviderRunOptions
  ): Promise<Workspace | null>;
  existsByRootname(name: string, opts?: SemanticProviderRunOptions): Promise<boolean>;
  workspaceExistsByName(
    name: string,
    opts?: SemanticProviderRunOptions
  ): Promise<boolean>;
}
