import {File, FilePresignedPath} from '../../../../definitions/file';
import {Resource} from '../../../../definitions/system';
import {DataProviderQueryListParams} from '../../data/types';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticWorkspaceResourceProvider';
import {SemanticProviderRunOptions} from '../types';
import {getInAndNinQuery} from '../utils';
import {SemanticFilePresignedPathProvider, SemanticFileProvider} from './types';

export class DataSemanticFile
  extends DataSemanticWorkspaceResourceProvider<File>
  implements SemanticFileProvider
{
  async getOneByNamepath(
    workspaceId: string,
    namepath: string[],
    extension?: string | undefined,
    opts?: SemanticProviderRunOptions | undefined
  ): Promise<File | null> {
    return await this.data.getOneByQuery(
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
  implements SemanticFilePresignedPathProvider {}
