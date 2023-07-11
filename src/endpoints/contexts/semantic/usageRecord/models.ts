import {UsageRecord} from '../../../../definitions/usageRecord';
import {DataSemanticDataAccessWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticDataAccessUsageRecordProviderType} from './types';

export class DataSemanticDataAccessUsageRecord
  extends DataSemanticDataAccessWorkspaceResourceProvider<UsageRecord>
  implements SemanticDataAccessUsageRecordProviderType {}
