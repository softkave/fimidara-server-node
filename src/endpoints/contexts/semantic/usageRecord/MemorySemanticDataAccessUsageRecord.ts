import {UsageRecord} from '../../../../definitions/usageRecord';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {SemanticDataAccessUsageRecordProviderType} from './types';

export class MemorySemanticDataAccessUsageRecord
  extends SemanticDataAccessWorkspaceResourceProvider<UsageRecord>
  implements SemanticDataAccessUsageRecordProviderType {}
