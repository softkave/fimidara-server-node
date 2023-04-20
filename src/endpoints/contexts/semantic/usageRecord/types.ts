import {UsageRecord} from '../../../../definitions/usageRecord';
import {ISemanticDataAccessWorkspaceResourceProvider} from '../types';

export interface ISemanticDataAccessUsageRecordProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<UsageRecord> {}
