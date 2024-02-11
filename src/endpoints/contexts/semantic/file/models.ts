import {File, PresignedPath} from '../../../../definitions/file';
import {Resource} from '../../../../definitions/system';
import {FileQueries} from '../../../files/queries';
import {DataProviderQueryListParams} from '../../data/types';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderRunOptions} from '../types';
import {getInAndNinQuery} from '../utils';
import {SemanticFileProvider, SemanticPresignedPathProvider} from './types';

export class DataSemanticFile
  extends DataSemanticWorkspaceResourceProvider<File>
  implements SemanticFileProvider
{
  async getOneByNamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    opts?: SemanticProviderRunOptions
  ): Promise<File | null> {
    return await this.data.getOneByQuery(FileQueries.getByNamepath(query), opts);
  }

  async deleteOneBynamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    opts?: SemanticProviderRunOptions
  ) {
    await this.data.deleteOneByQuery(FileQueries.getByNamepath(query), opts);
  }

  async getAndUpdateOneBynamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    update: Partial<File>,
    opts?: SemanticProviderRunOptions
  ): Promise<File | null> {
    return await this.data.getAndUpdateOneByQuery(
      FileQueries.getByNamepath(query),
      update,
      opts
    );
  }

  async getManyByNamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    opts?: SemanticProviderRunOptions
  ): Promise<File[]> {
    return await this.data.getManyByQuery(FileQueries.getByNamepath(query), opts);
  }

  async getManyByWorkspaceParentAndIdList(
    query: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    options?: (DataProviderQueryListParams<File> & SemanticProviderRunOptions) | undefined
  ): Promise<File[]> {
    return await this.data.getManyByQuery(
      {
        workspaceId: query.workspaceId,
        parentId: query.parentId,
        ...getInAndNinQuery<Resource>(
          'resourceId',
          query.resourceIdList,
          query.excludeResourceIdList
        ),
      },
      options
    );
  }

  async countManyParentByIdList(
    query: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<number> {
    return await this.data.countByQuery(
      {
        workspaceId: query.workspaceId,
        parentId: query.parentId,
        ...getInAndNinQuery<Resource>(
          'resourceId',
          query.resourceIdList,
          query.excludeResourceIdList
        ),
      },
      opts
    );
  }
}

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
