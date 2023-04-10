import {IWorkspace} from '../../../../definitions/workspace';
import {
  ISemanticDataAccessProviderRunOptions,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessWorkspaceProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IWorkspace> {
  getByRootname(
    name: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<IWorkspace | null>;
  existsByRootname(name: string, opts?: ISemanticDataAccessProviderRunOptions): Promise<boolean>;
  workspaceExistsByName(
    name: string,
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<boolean>;
}
