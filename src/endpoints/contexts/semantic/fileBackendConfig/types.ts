import {FileBackendConfig} from '../../../../definitions/fileBackend';
import {SemanticWorkspaceResourceProviderType} from '../types';

export interface SemanticFileBackendConfigProvider
  extends SemanticWorkspaceResourceProviderType<FileBackendConfig> {}
