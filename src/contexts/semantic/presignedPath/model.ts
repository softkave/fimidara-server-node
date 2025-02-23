import {PresignedPath} from '../../../definitions/presignedPath.js';
import {FileQueries} from '../../../endpoints/files/queries.js';
import {DataQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../SemanticBaseProvider.js';
import {SemanticWorkspaceResourceProvider} from '../SemanticWorkspaceResourceProvider.js';
import {
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
} from '../types.js';
import {SemanticPresignedPathProvider} from './types.js';

export class DataSemanticPresignedPathProvider
  extends SemanticWorkspaceResourceProvider<PresignedPath>
  implements SemanticPresignedPathProvider
{
  async getOneByFileId(
    id: string,
    options?: SemanticProviderQueryParams<PresignedPath>
  ): Promise<PresignedPath | null> {
    const query = addIsDeletedIntoQuery<DataQuery<PresignedPath>>(
      {fileId: id},
      options?.includeDeleted || false
    );
    return await this.data.getOneByQuery(query, options);
  }

  async getManyByFileIds(
    ids: string[],
    options?: SemanticProviderQueryListParams<PresignedPath>
  ): Promise<PresignedPath[]> {
    const query = addIsDeletedIntoQuery<DataQuery<PresignedPath>>(
      {fileId: {$in: ids}},
      options?.includeDeleted || false
    );
    return await this.data.getManyByQuery(query, options);
  }

  async getOneByFilepath(
    query: {workspaceId: string; namepath: string[]; ext?: string},
    options?: SemanticProviderQueryParams<PresignedPath>
  ): Promise<PresignedPath | null> {
    const dataQuery = addIsDeletedIntoQuery<DataQuery<PresignedPath>>(
      FileQueries.getByNamepath(query),
      options?.includeDeleted || false
    );
    return await this.data.getOneByQuery(dataQuery, options);
  }
}
