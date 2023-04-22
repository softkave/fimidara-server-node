import {Workspace} from '../../../../definitions/workspace';
import {SemanticDataAccessProviderRunOptions} from '../types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {SemanticDataAccessWorkspaceProviderType} from './types';

export class MemorySemanticDataAccessWorkspace
  extends SemanticDataAccessWorkspaceResourceProvider<Workspace>
  implements SemanticDataAccessWorkspaceProviderType
{
  async getByRootname(
    name: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<Workspace | null> {
    return await this.memstore.readItem({rootname: {$lowercaseEq: name}}, opts?.transaction);
  }

  async existsByRootname(
    name: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<boolean> {
    return await this.memstore.exists({rootname: {$lowercaseEq: name}}, opts?.transaction);
  }

  async workspaceExistsByName(
    name: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<boolean> {
    return await this.memstore.exists({name: {$lowercaseEq: name}}, opts?.transaction);
  }
}
