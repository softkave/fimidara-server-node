import {FilePart} from '../../../definitions/file.js';
import {DataQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../SemanticBaseProvider.js';
import {SemanticWorkspaceResourceProvider} from '../SemanticWorkspaceResourceProvider.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderQueryListParams,
} from '../types.js';
import {SemanticFilePartProvider} from './types.js';

export class SemanticFilePartProviderImpl
  extends SemanticWorkspaceResourceProvider<FilePart>
  implements SemanticFilePartProvider
{
  async getManyByFileId(
    id: string,
    opts?: SemanticProviderQueryListParams<FilePart>
  ): Promise<FilePart[]> {
    const query = addIsDeletedIntoQuery<DataQuery<FilePart>>(
      {fileId: id},
      opts?.includeDeleted || false
    );
    return await this.data.getManyByQuery(query, opts);
  }

  async getManyByMultipartIdAndPart(
    filter: {multipartId: string; part?: number | number[]},
    opts?: SemanticProviderQueryListParams<FilePart>
  ): Promise<FilePart[]> {
    const query = addIsDeletedIntoQuery<DataQuery<FilePart>>(
      {
        multipartId: filter.multipartId,
        ...(filter.part !== undefined
          ? Array.isArray(filter.part)
            ? {part: {$in: filter.part}}
            : {part: filter.part}
          : {}),
      },
      opts?.includeDeleted || false
    );
    return await this.data.getManyByQuery(query, opts);
  }

  async deleteManyByMultipartIdAndPart(
    filter: {multipartId: string; part?: number | number[]},
    opts?: SemanticProviderMutationParams
  ): Promise<void> {
    const query = addIsDeletedIntoQuery<DataQuery<FilePart>>(
      {
        multipartId: filter.multipartId,
        ...(filter.part !== undefined
          ? Array.isArray(filter.part)
            ? {part: {$in: filter.part}}
            : {part: filter.part}
          : {}),
      },
      false
    );
    await this.data.deleteManyByQuery(query, opts);
  }

  async deleteManyByFileId(
    id: string,
    opts?: SemanticProviderMutationParams
  ): Promise<void> {
    await this.data.deleteManyByQuery({fileId: id}, opts);
  }
}
