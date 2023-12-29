import {Workspace} from '../../../../definitions/workspace';
import {getLowercaseRegExpForString} from '../../../../utils/fns';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderRunOptions} from '../types';
import {SemanticWorkspaceProviderType} from './types';

export class DataSemanticWorkspace
  extends DataSemanticWorkspaceResourceProvider<Workspace>
  implements SemanticWorkspaceProviderType
{
  async getByRootname(
    name: string,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<Workspace | null> {
    return await this.data.getOneByQuery(
      {rootname: {$regex: getLowercaseRegExpForString(name)}},
      opts
    );
  }

  async existsByRootname(
    name: string,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<boolean> {
    return await this.data.existsByQuery(
      {rootname: {$regex: getLowercaseRegExpForString(name)}},
      opts
    );
  }

  async workspaceExistsByName(
    name: string,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<boolean> {
    return await this.data.existsByQuery(
      {name: {$regex: getLowercaseRegExpForString(name)}},
      opts
    );
  }
}
