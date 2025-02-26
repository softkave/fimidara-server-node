import {FilePersistenceUploadPartResult} from '../../../contexts/file/types.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderQueryListParams,
} from '../../../contexts/semantic/types.js';
import {FilePart} from '../../../definitions/file.js';
import {
  kFimidaraResourceType,
  SessionAgent,
} from '../../../definitions/system.js';
import {FimidaraConfigFilePersistenceProvider} from '../../../resources/config.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {applyDefaultEndpointPaginationOptions} from '../../pagination.js';
import {PaginationQuery} from '../../types.js';

export interface FilePartMeta extends FilePersistenceUploadPartResult {
  size: number;
}

export async function getMultipartUploadPartMetas(
  params: {
    multipartId: string;
    opts?: SemanticProviderQueryListParams<FilePart>;
  } & PaginationQuery
) {
  applyDefaultEndpointPaginationOptions(params);
  return await kSemanticModels
    .filePart()
    .getManyByMultipartId(params, {...params, ...params.opts});
}

export async function writeMultipartUploadPartMetas(params: {
  agent: SessionAgent;
  multipartId: string;
  parts: FilePartMeta[];
  fileId: string;
  backend: FimidaraConfigFilePersistenceProvider;
  raw: unknown;
  opts?: SemanticProviderMutationParams;
}) {
  const parts = params.parts.map(part => {
    return newWorkspaceResource<FilePart>(
      params.agent,
      kFimidaraResourceType.filePart,
      params.multipartId,
      {
        part: part.part,
        size: part.size,
        partId: part.partId,
        multipartId: part.multipartId,
        fileId: params.fileId,
        backend: params.backend,
        raw: params.raw,
      }
    );
  });

  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels.filePart().insertItem(parts, opts);
  }, params.opts);
}

export async function deleteMultipartUploadPartMetas(params: {
  multipartId: string;
  part?: number;
  opts?: SemanticProviderMutationParams;
}): Promise<void> {
  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels.filePart().deleteManyByMultipartId(params, opts);
  }, params.opts);
}
