import {JobHistory} from '../../../../definitions/jobHistory.js';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider.js';
import {SemanticJobHistoryProvider} from './types.js';

export class DataSemanticJobHistory
  extends DataSemanticWorkspaceResourceProvider<JobHistory>
  implements SemanticJobHistoryProvider {}
