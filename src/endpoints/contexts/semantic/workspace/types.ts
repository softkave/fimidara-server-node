import {Workspace} from '../../../../definitions/workspace';
import {
  SemanticProviderTxnOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticWorkspaceProviderType
  extends SemanticWorkspaceResourceProviderType<Workspace> {
  getByRootname(
    name: string,
    opts?: SemanticProviderTxnOptions
  ): Promise<Workspace | null>;
  existsByRootname(name: string, opts?: SemanticProviderTxnOptions): Promise<boolean>;
  workspaceExistsByName(
    name: string,
    opts?: SemanticProviderTxnOptions
  ): Promise<boolean>;
}
