import {container} from 'tsyringe';
import {
  FileBackendConfig,
  FileBackendMount,
  PublicFileBackendConfig,
  PublicFileBackendMount,
} from '../../definitions/fileBackend';
import {ConvertAgentToPublicAgent} from '../../definitions/system';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {kSemanticModels} from '../contexts/injectables';
import {kInjectionKeys} from '../contexts/injection';
import {
  SemanticFileBackendMountProvider,
  SemanticProviderRunOptions,
} from '../contexts/semantic/types';
import {workspaceResourceFields} from '../utils';
import {NewFileBackendMountInput} from './addMount/types';

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
  filesCompletelyIngested: true,
  foldersCompletelyIngested: true,
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
  data: Pick<NewFileBackendMountInput, 'folderpath' | 'mountedFrom' | 'backend'>,
  opts?: SemanticProviderRunOptions
) {
  const mountModel = container.resolve<SemanticFileBackendMountProvider>(
    kInjectionKeys.semantic.fileBackendMount
  );

  return await mountModel.existsByQuery(
    {
      backend: data.backend,
      folderpath: {$all: data.folderpath, $size: data.folderpath.length},
      mountedFrom: {$all: data.mountedFrom, $size: data.mountedFrom.length},
    },
    opts
  );
}
