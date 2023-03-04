import {IWorkspace} from '../../../../definitions/workspace';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessWorkspaceProvider} from './types';

export class MemorySemanticDataAccessWorkspace
  extends SemanticDataAccessWorkspaceResourceProvider<IWorkspace>
  implements ISemanticDataAccessWorkspaceProvider
{
  async getByRootname(rootname: string): Promise<IWorkspace | null> {
    return this.memstore.readItem({rootname: {$regex: new RegExp(rootname, 'i')}});
  }

  async existsByRootname(rootname: string): Promise<boolean> {
    return !!(await this.getByRootname(rootname));
  }
}
