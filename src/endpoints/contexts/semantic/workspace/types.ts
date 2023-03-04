import {IWorkspace} from '../../../../definitions/workspace';
import {ISemanticDataAccessWorkspaceResourceProvider} from '../types';

export interface ISemanticDataAccessWorkspaceProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IWorkspace> {
  getByRootname(name: string): Promise<IWorkspace | null>;
  existsByRootname(name: string): Promise<boolean>;
}
