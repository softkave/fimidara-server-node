import {AppRuntimeState} from '../../../../definitions/system';
import {SemanticDataAccessBaseProvider} from '../utils';
import {SemanticDataAccessAppRuntimeStateProvider} from './types';

export class MemorySemanticDataAccessAppRuntimeState
  extends SemanticDataAccessBaseProvider<AppRuntimeState>
  implements SemanticDataAccessAppRuntimeStateProvider {}
