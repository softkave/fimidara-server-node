import {ITag} from '../../../../definitions/tag';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessTagProvider} from './types';

export class MemorySemanticDataAccessTag
  extends SemanticDataAccessWorkspaceResourceProvider<ITag>
  implements ISemanticDataAccessTagProvider {}
