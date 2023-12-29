import {FileBackendConfig} from '../../../../definitions/fileBackend';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticFileBackendConfigProvider} from './types';

export class DataSemanticFileBackendConfig
  extends DataSemanticWorkspaceResourceProvider<FileBackendConfig>
  implements SemanticFileBackendConfigProvider {}
