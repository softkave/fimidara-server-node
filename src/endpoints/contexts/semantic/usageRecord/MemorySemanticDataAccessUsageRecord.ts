import {UsageRecord} from '../../../../definitions/usageRecord';
import {MemorySemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {SemanticDataAccessUsageRecordProviderType} from './types';

export class MemorySemanticDataAccessUsageRecord
  extends MemorySemanticDataAccessWorkspaceResourceProvider<UsageRecord>
  implements SemanticDataAccessUsageRecordProviderType {}
