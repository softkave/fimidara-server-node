import {IUsageRecord} from '../../../../definitions/usageRecord';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessUsageRecordProvider} from './types';

export class MemorySemanticDataAccessUsageRecord
  extends SemanticDataAccessWorkspaceResourceProvider<IUsageRecord>
  implements ISemanticDataAccessUsageRecordProvider {}
