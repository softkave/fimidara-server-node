import {File, FilePresignedPath} from '../../../../definitions/file';
import {DataProviderQueryListParams} from '../../data/types';
import {DataSemanticDataAccessWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticDataAccessProviderRunOptions} from '../types';
import {SemanticDataAccessFilePresignedPathProvider, SemanticDataAccessFileProvider} from './types';

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
    return await this.data.getOneByQuery({workspaceId, extension, namePath: {$eq: namePath}}, opts);
  }

  async getManyByWorkspaceParentAndIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    options?: (DataProviderQueryListParams<File> & SemanticDataAccessProviderRunOptions) | undefined
  ): Promise<File[]> {
    return await this.data.getManyByQuery(
      {
        workspaceId: q.workspaceId,
        parentId: q.parentId,
        resourceId: {$in: q.resourceIdList, $nin: q.excludeResourceIdList},
      },
      options
    );
  }

  async countManyParentByIdList(
    q: {
      workspaceId: string;
      parentId: string | null;
      resourceIdList?: string[] | undefined;
      excludeResourceIdList?: string[] | undefined;
    },
    opts?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<number> {
    return await this.data.countByQuery(
      {
        workspaceId: q.workspaceId,
        parentId: q.parentId,
        resourceId: {$in: q.resourceIdList, $nin: q.excludeResourceIdList},
      },
      opts
    );
  }
}

export class DataSemanticDataAccessFilePresignedPathProvider
  extends DataSemanticDataAccessWorkspaceResourceProvider<FilePresignedPath>
  implements SemanticDataAccessFilePresignedPathProvider {}
