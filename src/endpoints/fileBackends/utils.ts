import {container} from 'tsyringe';
import {
  FileBackendConfig,
  FileBackendMount,
  PublicFileBackendConfig,
} from '../../definitions/fileBackend';
import {ConvertAgentToPublicAgent} from '../../definitions/system';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {kInjectionKeys} from '../contexts/injection';
import {
  SemanticFileBackendMountProvider,
  SemanticProviderRunOptions,
} from '../contexts/semantic/types';
import {workspaceResourceFields} from '../utils';
import {AddFileBackendMountEndpointParams} from './addMount/types';

const fileBackendMountFields = getFields<ConvertAgentToPublicAgent<FileBackendMount>>({
  ...workspaceResourceFields,
  folderpath: true,
  index: true,
  mountedFrom: true,
  product: true,
  configId: true,
  description: true,
  name: true,
});

export const fileBackendMountExtractor = makeExtract(fileBackendMountFields);
export const fileBackendMountListExtractor = makeListExtract(fileBackendMountFields);

const fileBackendConfigFields = getFields<PublicFileBackendConfig>({
  ...workspaceResourceFields,
  type: true,
});

export const fileBackendConfigExtractor = makeExtract(fileBackendConfigFields);
export const fileBackendConfigListExtractor = makeListExtract(fileBackendConfigFields);

export async function mountNameExists(
  mount: Pick<FileBackendMount, 'workspaceId' | 'name'>
): Promise<boolean> {
  throw kReuseableErrors.common.notImplemented();
}

export async function configNameExists(
  mount: Pick<FileBackendConfig, 'workspaceId' | 'name'>
): Promise<boolean> {
  throw kReuseableErrors.common.notImplemented();
}

export async function mountExists(
  data: Pick<AddFileBackendMountEndpointParams, 'folderpath' | 'mountedFrom' | 'product'>,
  opts?: SemanticProviderRunOptions
) {
  const mountModel = container.resolve<SemanticFileBackendMountProvider>(
    kInjectionKeys.semantic.fileBackendMount
  );

  return await mountModel.existsByQuery(
    {
      product: data.product,
      folderpath: {$all: data.folderpath, $size: data.folderpath.length},
      mountedFrom: {$all: data.mountedFrom, $size: data.mountedFrom.length},
    },
    opts
  );
}
