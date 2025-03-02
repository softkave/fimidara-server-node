import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {
  FileBackendConfig,
  FileBackendMount,
  PublicFileBackendConfig,
  PublicFileBackendMount,
  PublicResolvedMountEntry,
} from '../../definitions/fileBackend.js';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract.js';
import {workspaceResourceFields} from '../extractors.js';
import {FolderQueries} from '../folders/queries.js';
import {FileMountQueries} from './mountQueries.js';

const resolvedEntryFields = getFields<PublicResolvedMountEntry>({
  ...workspaceResourceFields,
  mountId: true,
  backendNamepath: true,
  backendExt: true,
  fimidaraNamepath: true,
  fimidaraExt: true,
  forType: true,
  forId: true,
});

export const resolvedEntryExtractor = makeExtract(resolvedEntryFields);
export const resolvedEntryListExtractor = makeListExtract(resolvedEntryFields);

const fileBackendMountFields = getFields<PublicFileBackendMount>({
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
export const fileBackendMountListExtractor = makeListExtract(
  fileBackendMountFields
);

const fileBackendConfigFields = getFields<PublicFileBackendConfig>({
  ...workspaceResourceFields,
  backend: true,
  name: true,
  description: true,
});

export const fileBackendConfigExtractor = makeExtract(fileBackendConfigFields);
export const fileBackendConfigListExtractor = makeListExtract(
  fileBackendConfigFields
);

export async function mountNameExists(
  mount: Pick<FileBackendMount, 'workspaceId' | 'name'>,
  opts?: SemanticProviderOpParams
): Promise<boolean> {
  return await kIjxSemantic
    .fileBackendMount()
    .existsByName(mount.workspaceId, mount.name, opts);
}

export async function configNameExists(
  config: Pick<FileBackendConfig, 'workspaceId' | 'name'>,
  opts?: SemanticProviderOpParams
): Promise<boolean> {
  return await kIjxSemantic
    .fileBackendConfig()
    .existsByName(config.workspaceId, config.name, opts);
}

export async function mountExists(
  data: Pick<
    FileBackendMount,
    'namepath' | 'mountedFrom' | 'backend' | 'workspaceId'
  >,
  opts?: SemanticProviderOpParams
) {
  const mountModel = kIjxSemantic.fileBackendMount();
  return await mountModel.existsByQuery(
    FileMountQueries.getBySignature(data),
    opts
  );
}

export async function countFolderAttachedMounts(
  folderpath: string[],
  opts?: SemanticProviderOpParams
) {
  return await kIjxSemantic
    .fileBackendMount()
    .existsByQuery(
      FolderQueries.getByNamepathOnly({namepath: folderpath}),
      opts
    );
}
