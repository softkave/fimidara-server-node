import {Workspace} from '../../../../definitions/workspace';
import {DataQuery} from '../../data/types';
import {addIsDeletedIntoQuery} from '../DataSemanticDataAccessBaseProvider';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderOpParams, SemanticProviderQueryParams} from '../types';
import {getIgnoreCaseDataQueryRegExp} from '../utils';
import {SemanticWorkspaceProviderType} from './types';

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
