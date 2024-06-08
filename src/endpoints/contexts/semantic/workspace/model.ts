import {Workspace} from '../../../../definitions/workspace.js';
import {DataQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../DataSemanticDataAccessBaseProvider.js';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider.js';
import {SemanticProviderOpParams, SemanticProviderQueryParams} from '../types.js';
import {getIgnoreCaseDataQueryRegExp} from '../utils.js';
import {SemanticWorkspaceProviderType} from './types.js';

export class DataSemanticWorkspace
  extends DataSemanticWorkspaceResourceProvider<Workspace>
  implements SemanticWorkspaceProviderType
{
  async getByRootname(
    name: string,
    opts?: SemanticProviderQueryParams<Workspace> | undefined
  ): Promise<Workspace | null> {
    const query = addIsDeletedIntoQuery<DataQuery<Workspace>>(
      {rootname: getIgnoreCaseDataQueryRegExp(name)},
      opts?.includeDeleted || false
    );
    return await this.data.getOneByQuery(query, opts);
  }

  async existsByRootname(
    name: string,
    opts?: SemanticProviderOpParams | undefined
  ): Promise<boolean> {
    const query = addIsDeletedIntoQuery<DataQuery<Workspace>>(
      {rootname: getIgnoreCaseDataQueryRegExp(name)},
      opts?.includeDeleted || false
    );
    return await this.data.existsByQuery(query, opts);
  }

  async workspaceExistsByName(
    name: string,
    opts?: SemanticProviderOpParams | undefined
  ): Promise<boolean> {
    const query = addIsDeletedIntoQuery<DataQuery<Workspace>>(
      {name: getIgnoreCaseDataQueryRegExp(name)},
      opts?.includeDeleted || false
    );
    return await this.data.existsByQuery(query, opts);
  }
}
