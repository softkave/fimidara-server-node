import {Tag} from '../../../../definitions/tag';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessTagProvider} from './types';

export class MemorySemanticDataAccessTag
  extends SemanticDataAccessWorkspaceResourceProvider<Tag>
  implements ISemanticDataAccessTagProvider {}
