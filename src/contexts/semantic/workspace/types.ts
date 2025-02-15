import {Workspace} from '../../../definitions/workspace.js';
import {
  SemanticProviderQueryParams,
  SemanticWorkspaceResourceProviderType,
} from '../types.js';

export interface SemanticWorkspaceProviderType
  extends SemanticWorkspaceResourceProviderType<Workspace> {
  getByRootname(
    name: string,
    opts?: SemanticProviderQueryParams<Workspace>
  ): Promise<Workspace | null>;
  getByWorkspaceName(
    name: string,
    opts?: SemanticProviderQueryParams<Workspace>
  ): Promise<Workspace | null>;
}
