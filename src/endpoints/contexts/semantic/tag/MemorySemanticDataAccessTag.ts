import {Tag} from '../../../../definitions/tag';
import {MemorySemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {SemanticDataAccessTagProviderType} from './types';

export class MemorySemanticDataAccessTag
  extends MemorySemanticDataAccessWorkspaceResourceProvider<Tag>
  implements SemanticDataAccessTagProviderType {}
