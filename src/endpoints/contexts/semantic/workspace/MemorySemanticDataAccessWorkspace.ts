import {IWorkspace} from '../../../../definitions/workspace';
import {ISemanticDataAccessProviderRunOptions} from '../types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessWorkspaceProvider} from './types';

export class MemorySemanticDataAccessWorkspace
  extends SemanticDataAccessWorkspaceResourceProvider<IWorkspace>
  implements ISemanticDataAccessWorkspaceProvider
{
  async getByRootname(
    name: string,
    opts?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<IWorkspace | null> {
    return await this.memstore.readItem({rootname: {$lowercaseEq: name}}, opts?.transaction);
  }

  async existsByRootname(
    name: string,
    opts?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<boolean> {
    return await this.memstore.exists({rootname: {$lowercaseEq: name}}, opts?.transaction);
  }

  async workspaceExistsByName(
    name: string,
    opts?: ISemanticDataAccessProviderRunOptions | undefined
  ): Promise<boolean> {
    return await this.memstore.exists({name: {$lowercaseEq: name}}, opts?.transaction);
  }
}
