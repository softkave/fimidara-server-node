import {
  FileBackendConfig,
  FileBackendMount,
  PublicFileBackendConfig,
  PublicFileBackendMount,
  PublicResolvedMountEntry,
} from '../../definitions/fileBackend';
import {ConvertAgentToPublicAgent} from '../../definitions/system';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {kSemanticModels} from '../contexts/injection/injectables';
import {SemanticProviderOpParams} from '../contexts/semantic/types';
import {workspaceResourceFields} from '../extractors';
import {FolderQueries} from '../folders/queries';

import {FileMountQueries} from './mountQueries';

const resolvedEntryFields = getFields<PublicResolvedMountEntry>({
  ...workspaceResourceFields,
  mountId: true,
  resolvedAt: true,
  extension: true,
  namepath: true,
  resolvedForType: true,
});

export const resolvedEntryExtractor = makeExtract(resolvedEntryFields);
export const resolvedEntryListExtractor = makeListExtract(resolvedEntryFields);

const fileBackendMountFields = getFields<
  ConvertAgentToPublicAgent<PublicFileBackendMount>
>({
  ...workspaceResourceFields,
  namepath: true,
  index: true,
  mountedFrom: true,
  backend: true,
  configId: true,
  description: true,
  name: true,
});

export const fileBackendMountExtractor = makeExtract(fileBackendMountFields);
export const fileBackendMountListExtractor = makeListExtract(fileBackendMountFields);

const fileBackendConfigFields = getFields<PublicFileBackendConfig>({
  ...workspaceResourceFields,
  backend: true,
  name: true,
  description: true,
});

export const fileBackendConfigExtractor = makeExtract(fileBackendConfigFields);
export const fileBackendConfigListExtractor = makeListExtract(fileBackendConfigFields);

export async function mountNameExists(
  mount: Pick<FileBackendMount, 'workspaceId' | 'name'>,
  opts?: SemanticProviderOpParams
): Promise<boolean> {
  return await kSemanticModels
    .fileBackendMount()
    .existsByName(mount.workspaceId, mount.name, opts);
}

export async function configNameExists(
  config: Pick<FileBackendConfig, 'workspaceId' | 'name'>,
  opts?: SemanticProviderOpParams
): Promise<boolean> {
  return await kSemanticModels
    .fileBackendConfig()
    .existsByName(config.workspaceId, config.name, opts);
}

export async function mountExists(
  data: Pick<FileBackendMount, 'namepath' | 'mountedFrom' | 'backend' | 'workspaceId'>,
  opts?: SemanticProviderOpParams
) {
  const mountModel = kSemanticModels.fileBackendMount();
  return await mountModel.existsByQuery(FileMountQueries.getBySignature(data), opts);
}

export async function countFolderAttachedMounts(
  folderpath: string[],
  opts?: SemanticProviderOpParams
) {
  return await kSemanticModels
    .fileBackendMount()
    .existsByQuery(FolderQueries.getByNamepathOnly({namepath: folderpath}), opts);
}
