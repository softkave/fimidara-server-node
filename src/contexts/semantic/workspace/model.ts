import {Workspace} from '../../../definitions/workspace.js';
import {DataQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../SemanticBaseProvider.js';
import {SemanticWorkspaceResourceProvider} from '../SemanticWorkspaceResourceProvider.js';
import {SemanticProviderQueryParams} from '../types.js';
import {getIgnoreCaseDataQueryRegExp} from '../utils.js';
import {SemanticWorkspaceProviderType} from './types.js';

export class DataSemanticWorkspace
  extends SemanticWorkspaceResourceProvider<Workspace>
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

  async getByWorkspaceName(
    name: string,
    opts?: SemanticProviderQueryParams<Workspace>
  ): Promise<Workspace | null> {
    const query = addIsDeletedIntoQuery<DataQuery<Workspace>>(
      {name: getIgnoreCaseDataQueryRegExp(name)},
      opts?.includeDeleted || false
    );
    return await this.data.getOneByQuery(query, opts);
  }
}
