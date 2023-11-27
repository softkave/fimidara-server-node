import {FileBackendConfig} from '../../../../definitions/fileBackend';
import {SemanticDataAccessWorkspaceResourceProviderType} from '../types';

export interface SemanticDataAccessFileBackendConfigProvider
  extends SemanticDataAccessWorkspaceResourceProviderType<FileBackendConfig> {}
