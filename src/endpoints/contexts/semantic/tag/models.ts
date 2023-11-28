import {Tag} from '../../../../definitions/tag';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticWorkspaceResourceProvider';
import {SemanticTagProviderType} from './types';

export class DataSemanticTag
  extends DataSemanticWorkspaceResourceProvider<Tag>
  implements SemanticTagProviderType {}
