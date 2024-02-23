import {Workspace} from '../../../../definitions/workspace';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderTxnOptions} from '../types';
import {getIgnoreCaseDataQueryRegExp} from '../utils';
import {SemanticWorkspaceProviderType} from './types';

export class DataSemanticWorkspace
  extends DataSemanticWorkspaceResourceProvider<Workspace>
  implements SemanticWorkspaceProviderType
{
  async getByRootname(
    name: string,
    opts?: SemanticProviderTxnOptions | undefined
  ): Promise<Workspace | null> {
    return await this.data.getOneByQuery(
      {rootname: getIgnoreCaseDataQueryRegExp(name)},
      opts
    );
  }

  async existsByRootname(
    name: string,
    opts?: SemanticProviderTxnOptions | undefined
  ): Promise<boolean> {
    return await this.data.existsByQuery(
      {rootname: getIgnoreCaseDataQueryRegExp(name)},
      opts
    );
  }

  async workspaceExistsByName(
    name: string,
    opts?: SemanticProviderTxnOptions | undefined
  ): Promise<boolean> {
    return await this.data.existsByQuery(
      {name: getIgnoreCaseDataQueryRegExp(name)},
      opts
    );
  }
}
