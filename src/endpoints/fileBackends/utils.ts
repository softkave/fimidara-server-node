import {FileBackendMount, PublicFileBackendConfig} from '../../definitions/fileBackend';
import {ConvertAgentToPublicAgent} from '../../definitions/system';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {workspaceResourceFields} from '../utils';

const fileBackendMountFields = getFields<ConvertAgentToPublicAgent<FileBackendMount>>({
  ...workspaceResourceFields,
  folderpath: true,
  index: true,
  mountedFrom: true,
  product: true,
  configId: true,
  type: true,
});

export const fileBackendMountExtractor = makeExtract(fileBackendMountFields);
export const fileBackendMountListExtractor = makeListExtract(fileBackendMountFields);

const fileBackendConfigFields = getFields<PublicFileBackendConfig>({
  ...workspaceResourceFields,
  type: true,
});

export const fileBackendConfigExtractor = makeExtract(fileBackendConfigFields);
export const fileBackendConfigListExtractor = makeListExtract(fileBackendConfigFields);
