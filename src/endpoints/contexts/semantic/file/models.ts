import {File, FilePresignedPath} from '../../../../definitions/file';
import {Resource} from '../../../../definitions/system';
import {DataProviderQueryListParams} from '../../data/types';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderRunOptions} from '../types';
import {getInAndNinQuery} from '../utils';
import {SemanticFilePresignedPathProvider, SemanticFileProvider} from './types';

export class DataSemanticFile
  extends DataSemanticWorkspaceResourceProvider<File>
  implements SemanticFileProvider
{
  async getOneByNamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    opts?: SemanticProviderRunOptions
  ): Promise<File | null> {
    const {workspaceId, namepath, extension} = query;
    return await this.data.getOneByQuery(
      {workspaceId, extension, namepath: {$all: namepath, $size: namepath.length}},
      opts
    );
  }

  async deleteOneBynamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    opts?: SemanticProviderRunOptions
  ) {
    const {workspaceId, namepath, extension} = query;
    await this.data.deleteOneByQuery(
      {workspaceId, extension, namepath: {$all: namepath, $size: namepath.length}},
      opts
    );
  }

  async getAndUpdateOneBynamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    update: Partial<File>,
    opts?: SemanticProviderRunOptions
  ): Promise<File | null> {
    const {workspaceId, namepath, extension} = query;
    return await this.data.getAndUpdateOneByQuery(
      {workspaceId, extension, namepath: {$all: namepath, $size: namepath.length}},
      update,
      opts
    );
  }

  async getManyByNamepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    opts?: SemanticProviderRunOptions
  ): Promise<File[]> {
    const {workspaceId, namepath, extension} = query;
    return await this.data.getManyByQuery(
      {workspaceId, extension, namepath: {$all: namepath, $size: namepath.length}},
      opts
    );
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

export class DataSemanticFilePresignedPathProvider
  extends DataSemanticWorkspaceResourceProvider<FilePresignedPath>
  implements SemanticFilePresignedPathProvider
{
  async getOneByFileId(
    id: string,
    options?: DataProviderQueryListParams<FilePresignedPath> & SemanticProviderRunOptions
  ): Promise<FilePresignedPath | null> {
    return await this.data.getOneByQuery({fileId: id}, options);
  }

  async getManyByFileIds(
    ids: string[],
    options?: DataProviderQueryListParams<FilePresignedPath> & SemanticProviderRunOptions
  ): Promise<FilePresignedPath[]> {
    return await this.data.getManyByQuery({fileId: {$in: ids}}, options);
  }

  async getOneByFilepath(
    query: {workspaceId: string; namepath: string[]; extension?: string},
    options?: DataProviderQueryListParams<FilePresignedPath> & SemanticProviderRunOptions
  ): Promise<FilePresignedPath | null> {
    const {workspaceId, namepath, extension} = query;
    return await this.data.getOneByQuery(
      {workspaceId, extension, namepath: {$all: namepath, $size: namepath.length}},
      options
    );
  }
}
