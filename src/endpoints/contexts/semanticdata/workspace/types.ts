import {IWorkspace} from '../../../../definitions/workspace';
import {
  ISemanticDataAccessNamedResourceProvider,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessWorkspaceProvider
  extends ISemanticDataAccessNamedResourceProvider<IWorkspace>,
    ISemanticDataAccessWorkspaceResourceProvider<IWorkspace> {
  getByRootname(name: string): Promise<IWorkspace | null>;
  existsByRootname(name: string): Promise<boolean>;
}
