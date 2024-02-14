import {Job} from '../../../../definitions/job';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticJobProvider} from './types';

export class DataSemanticJob
  extends DataSemanticWorkspaceResourceProvider<Job>
  implements SemanticJobProvider {}
