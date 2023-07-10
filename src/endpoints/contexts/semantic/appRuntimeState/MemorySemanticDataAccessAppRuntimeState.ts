import {AppRuntimeState} from '../../../../definitions/system';
import {MemorySemanticDataAccessBaseProvider} from '../utils';
import {SemanticDataAccessAppRuntimeStateProvider} from './types';

export class MemorySemanticDataAccessAppRuntimeState
  extends MemorySemanticDataAccessBaseProvider<AppRuntimeState>
  implements SemanticDataAccessAppRuntimeStateProvider {}
