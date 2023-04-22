import {Tag} from '../../../../definitions/tag';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {SemanticDataAccessTagProviderType} from './types';

export class MemorySemanticDataAccessTag
  extends SemanticDataAccessWorkspaceResourceProvider<Tag>
  implements SemanticDataAccessTagProviderType {}
