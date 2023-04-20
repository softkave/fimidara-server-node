import {UsageRecord} from '../../../../definitions/usageRecord';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessUsageRecordProvider} from './types';

export class MemorySemanticDataAccessUsageRecord
  extends SemanticDataAccessWorkspaceResourceProvider<UsageRecord>
  implements ISemanticDataAccessUsageRecordProvider {}
