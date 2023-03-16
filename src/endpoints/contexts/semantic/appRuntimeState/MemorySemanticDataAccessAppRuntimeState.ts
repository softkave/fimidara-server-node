import {IAppRuntimeState} from '../../../../definitions/system';
import {SemanticDataAccessBaseProvider} from '../utils';
import {ISemanticDataAccessAppRuntimeStateProvider} from './types';

export class MemorySemanticDataAccessAppRuntimeState
  extends SemanticDataAccessBaseProvider<IAppRuntimeState>
  implements ISemanticDataAccessAppRuntimeStateProvider {}
