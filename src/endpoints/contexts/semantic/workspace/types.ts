import {Workspace} from '../../../../definitions/workspace';
import {
  ISemanticDataAccessProviderRunOptions,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessWorkspaceProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<Workspace> {
  getByRootname(
    name: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<Workspace | null>;
  existsByRootname(name: string, opts?: ISemanticDataAccessProviderRunOptions): Promise<boolean>;
  workspaceExistsByName(
    name: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<boolean>;
}
