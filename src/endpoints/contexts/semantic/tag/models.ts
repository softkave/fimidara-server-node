import {Tag} from '../../../../definitions/tag';
import {DataSemanticDataAccessWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticDataAccessTagProviderType} from './types';

export class DataSemanticDataAccessTag
  extends DataSemanticDataAccessWorkspaceResourceProvider<Tag>
  implements SemanticDataAccessTagProviderType {}
