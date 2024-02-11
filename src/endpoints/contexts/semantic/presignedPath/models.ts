import {PresignedPath} from '../../../../definitions/presignedPath';
import {FileQueries} from '../../../files/queries';
import {DataProviderQueryListParams} from '../../data/types';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderRunOptions} from '../types';
import {SemanticPresignedPathProvider} from './types';

export class DataSemanticPresignedPathProvider
  extends DataSemanticWorkspaceResourceProvider<PresignedPath>
  implements SemanticPresignedPathProvider
{
  async getOneByFileId(
    id: string,
    options?: DataProviderQueryListParams<PresignedPath> & SemanticProviderRunOptions
  ): Promise<PresignedPath | null> {
    return await this.data.getOneByQuery({fileId: id}, options);
  }

  async getManyByFileIds(
    ids: string[],
    options?: DataProviderQueryListParams<PresignedPath> & SemanticProviderRunOptions
  ): Promise<PresignedPath[]> {
    return await this.data.getManyByQuery({fileId: {$in: ids}}, options);
  }

  async getOneByFilepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    options?: DataProviderQueryListParams<PresignedPath> & SemanticProviderRunOptions
  ): Promise<PresignedPath | null> {
    return await this.data.getOneByQuery(FileQueries.getByNamepath(query), options);
  }
}
