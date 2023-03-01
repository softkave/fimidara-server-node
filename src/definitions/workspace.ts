import {IAgent, IWorkspaceResourceBase} from './system';
import {UsageRecordCategory} from './usageRecord';

export interface IUsageThreshold {
  lastUpdatedBy: IAgent;
  lastUpdatedAt: number;
  category: UsageRecordCategory;
  budget: number; // price in USD
}

export interface IUsageThresholdLock {
  lastUpdatedBy: IAgent;
  lastUpdatedAt: number;
  category: UsageRecordCategory;
  locked: boolean;
}

export enum WorkspaceBillStatus {
  Ok = 'ok',
  GracePeriod = 'gracePeriod',
  BillOverdue = 'billOverdue',
}

export interface IWorkspace extends IWorkspaceResourceBase {
  /**
   * Human readable name of the workspace.
   */
  name: string;

  /**
   * URL compatible name of the workspace.
   */
  rootname: string;
  description?: string;
  publicPermissionGroupId?: string;
  billStatusAssignedAt: number;
  billStatus: WorkspaceBillStatus;
  usageThresholds: Partial<Record<UsageRecordCategory, IUsageThreshold>>;
  usageThresholdLocks: Partial<Record<UsageRecordCategory, IUsageThresholdLock>>;
}

export type IPublicWorkspace = IWorkspace;
