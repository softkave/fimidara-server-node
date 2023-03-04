import {IUsageRecord} from '../../../../definitions/usageRecord';
import {ISemanticDataAccessWorkspaceResourceProvider} from '../types';

export interface ISemanticDataAccessUsageRecordProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IUsageRecord> {}
