import {AppRuntimeState} from '../../../../definitions/system';
import {SemanticDataAccessBaseProvider} from '../utils';
import {ISemanticDataAccessAppRuntimeStateProvider} from './types';

export class MemorySemanticDataAccessAppRuntimeState
  extends SemanticDataAccessBaseProvider<AppRuntimeState>
  implements ISemanticDataAccessAppRuntimeStateProvider {}
