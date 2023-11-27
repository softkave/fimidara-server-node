import {File, FilePresignedPath} from '../../../../definitions/file';
import {Resource} from '../../../../definitions/system';
import {DataProviderQueryListParams} from '../../data/types';
import {DataSemanticDataAccessWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticDataAccessProviderRunOptions} from '../types';
import {getInAndNinQuery} from '../utils';
import {
  SemanticDataAccessFilePresignedPathProvider,
  SemanticDataAccessFileProvider,
} from './types';

export class DataSemanticDataAccessFile
  extends DataSemanticDataAccessWorkspaceResourceProvider<File>
  implements SemanticDataAccessFileProvider
{
  async getOneByNamePath(
    workspaceId: string,
    namePath: string[],
    extension?: string | undefined,
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<File | null> {
    return await this.data.getOneByQuery(
      {workspaceId, extension, namePath: {$all: namePath, $size: namePath.length}},
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
    options?:
      | (DataProviderQueryListParams<File> & SemanticDataAccessProviderRunOptions)
      | undefined
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
    opts?: SemanticDataAccessProviderRunOptions | undefined
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

export class DataSemanticDataAccessFilePresignedPathProvider
  extends DataSemanticDataAccessWorkspaceResourceProvider<FilePresignedPath>
  implements SemanticDataAccessFilePresignedPathProvider {}
