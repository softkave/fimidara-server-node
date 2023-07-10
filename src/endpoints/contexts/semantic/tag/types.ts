import {Tag} from '../../../../definitions/tag';
import {SemanticDataAccessWorkspaceResourceProviderType} from '../types';

export interface SemanticDataAccessTagProviderType<TTxn>
  extends SemanticDataAccessWorkspaceResourceProviderType<Tag, TTxn> {}
