import {FileBackendConfig} from '../../../../definitions/fileBackend';
import {DataSemanticBaseProvider} from '../DataSemanticBaseProvider';
import {SemanticFileBackendConfigProvider} from './types';

export class DataSemanticFileBackendConfig
  extends DataSemanticBaseProvider<FileBackendConfig>
  implements SemanticFileBackendConfigProvider {}
