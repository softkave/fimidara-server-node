import {AppRuntimeState} from '../../../../definitions/system';
import {DataSemanticBaseProvider} from '../DataSemanticBaseProvider';
import {SemanticAppRuntimeStateProvider} from './types';

export class DataSemanticAppRuntimeState
  extends DataSemanticBaseProvider<AppRuntimeState>
  implements SemanticAppRuntimeStateProvider {}
