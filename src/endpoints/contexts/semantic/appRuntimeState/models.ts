import {AppRuntimeState} from '../../../../definitions/system';
import {DataSemanticBaseProvider} from '../DataSemanticDataAccessBaseProvider';
import {SemanticAppRuntimeStateProvider} from './types';

export class DataSemanticAppRuntimeState
  extends DataSemanticBaseProvider<AppRuntimeState>
  implements SemanticAppRuntimeStateProvider {}
