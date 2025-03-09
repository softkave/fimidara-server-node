import {FilePart} from '../../../definitions/file.js';
import {DataQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../SemanticBaseProvider.js';
import {SemanticWorkspaceResourceProvider} from '../SemanticWorkspaceResourceProvider.js';
import {SemanticProviderQueryListParams} from '../types.js';
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
}
