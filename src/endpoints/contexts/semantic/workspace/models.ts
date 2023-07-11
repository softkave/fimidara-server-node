import {Workspace} from '../../../../definitions/workspace';
import {getLowercaseRegExpForString} from '../../../../utils/fns';
import {DataSemanticDataAccessWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticDataAccessProviderRunOptions} from '../types';
import {SemanticDataAccessWorkspaceProviderType} from './types';

export class DataSemanticDataAccessWorkspace
  extends DataSemanticDataAccessWorkspaceResourceProvider<Workspace>
  implements SemanticDataAccessWorkspaceProviderType
{
  async getByRootname(
    name: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<Workspace | null> {
    return await this.data.getOneByQuery(
      {rootname: {$regex: getLowercaseRegExpForString(name)}},
      opts
    );
  }

  async existsByRootname(
    name: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<boolean> {
    return await this.data.existsByQuery(
      {rootname: {$regex: getLowercaseRegExpForString(name)}},
      opts
    );
  }

  async workspaceExistsByName(
    name: string,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<boolean> {
    return await this.data.existsByQuery({name: {$regex: getLowercaseRegExpForString(name)}}, opts);
  }
}
