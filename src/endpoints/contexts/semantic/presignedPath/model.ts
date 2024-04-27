import {PresignedPath} from '../../../../definitions/presignedPath';
import {FileQueries} from '../../../files/queries';
import {DataQuery} from '../../data/types';
import {addIsDeletedIntoQuery} from '../DataSemanticDataAccessBaseProvider';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderQueryListParams, SemanticProviderQueryParams} from '../types';
import {SemanticPresignedPathProvider} from './types';

export class DataSemanticPresignedPathProvider
  extends DataSemanticWorkspaceResourceProvider<PresignedPath>
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
