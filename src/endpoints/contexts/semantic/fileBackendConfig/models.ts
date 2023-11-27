import {FileBackendConfig} from '../../../../definitions/fileBackend';
import {DataSemanticDataAccessBaseProvider} from '../DataSemanticDataAccessBaseProvider';
import {SemanticDataAccessFileBackendConfigProvider} from './types';

export class DataSemanticDataAccessFileBackendConfig
  extends DataSemanticDataAccessBaseProvider<FileBackendConfig>
  implements SemanticDataAccessFileBackendConfigProvider {}
