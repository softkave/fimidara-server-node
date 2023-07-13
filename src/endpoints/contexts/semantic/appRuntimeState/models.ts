import {AppRuntimeState} from '../../../../definitions/system';
import {DataSemanticDataAccessBaseProvider} from '../DataSemanticDataAccessBaseProvider';
import {SemanticDataAccessAppRuntimeStateProvider} from './types';

export class DataSemanticDataAccessAppRuntimeState
  extends DataSemanticDataAccessBaseProvider<AppRuntimeState>
  implements SemanticDataAccessAppRuntimeStateProvider {}
