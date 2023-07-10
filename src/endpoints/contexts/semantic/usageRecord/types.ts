import {UsageRecord} from '../../../../definitions/usageRecord';
import {SemanticDataAccessWorkspaceResourceProviderType} from '../types';

export interface SemanticDataAccessUsageRecordProviderType<TTxn>
  extends SemanticDataAccessWorkspaceResourceProviderType<UsageRecord, TTxn> {}
