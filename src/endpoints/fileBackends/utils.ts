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
import {SemanticProviderRunOptions} from '../contexts/semantic/types';
import {workspaceResourceFields} from '../utils';

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
  folderpath: true,
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
  opts?: SemanticProviderRunOptions
): Promise<boolean> {
  return await kSemanticModels
    .fileBackendMount()
    .existsByName(mount.workspaceId, mount.name, opts);
}

export async function configNameExists(
  config: Pick<FileBackendConfig, 'workspaceId' | 'name'>,
  opts?: SemanticProviderRunOptions
): Promise<boolean> {
  return await kSemanticModels
    .fileBackendConfig()
    .existsByName(config.workspaceId, config.name, opts);
}

export async function mountExists(
  data: Pick<FileBackendMount, 'folderpath' | 'mountedFrom' | 'backend'>,
  opts?: SemanticProviderRunOptions
) {
  const mountModel = kSemanticModels.fileBackendMount();
  return await mountModel.existsByQuery(
    {
      backend: data.backend,
      folderpath: {$all: data.folderpath, $size: data.folderpath.length},
      mountedFrom: {$all: data.mountedFrom, $size: data.mountedFrom.length},
    },
    opts
  );
}

export async function countFolderAttachedMounts(
  folderpath: string[],
  opts?: SemanticProviderRunOptions
) {
  return await kSemanticModels
    .fileBackendMount()
    .existsByQuery({folderpath: {$all: folderpath, $size: folderpath.length}}, opts);
}
