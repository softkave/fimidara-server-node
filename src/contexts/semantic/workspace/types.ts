import {Workspace} from '../../../definitions/workspace.js';
import {
  SemanticProviderOpParams,
  SemanticProviderQueryParams,
  SemanticWorkspaceResourceProviderType,
} from '../types.js';

export interface SemanticWorkspaceProviderType
  extends SemanticWorkspaceResourceProviderType<Workspace> {
  getByRootname(
    params: {
      rootname: string;
      workspaceId?: string | null;
    },
    opts?: SemanticProviderQueryParams<Workspace>
  ): Promise<Workspace | null>;
  existsByRootname(
    params: {
      rootname: string;
      workspaceId?: string | null;
    },
    opts?: SemanticProviderOpParams
  ): Promise<boolean>;
  workspaceExistsByName(
    params: {
      name: string;
      workspaceId?: string | null;
    },
    opts?: SemanticProviderOpParams
  ): Promise<boolean>;
}
