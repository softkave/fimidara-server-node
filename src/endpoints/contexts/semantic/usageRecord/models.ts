import {UsageRecord} from '../../../../definitions/usageRecord';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticWorkspaceResourceProvider';
import {SemanticUsageRecordProviderType} from './types';

export class DataSemanticUsageRecord
  extends DataSemanticWorkspaceResourceProvider<UsageRecord>
  implements SemanticUsageRecordProviderType {}
