import {IAgent} from './system';
import {UsageRecordCategory} from './usageRecord';

export interface IUsageThreshold {
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  category: UsageRecordCategory;
  budget: number; // price in USD
}

export interface IUsageThresholdLock {
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  category: UsageRecordCategory;
  locked: boolean;
}

export enum WorkspaceBillStatus {
  Ok = 'ok',
  GracePeriod = 'gracePeriod',
  BillOverdue = 'billOverdue',
}

export interface IWorkspace {
  resourceId: string;
  createdBy: IAgent;
  createdAt: Date | string;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;

  // Human readable name of the workspace
  name: string;

  // URL compatible name of the workspace
  rootname: string;
  description?: string;
  publicPermissionGroupId?: string;
  billStatusAssignedAt?: Date | string;
  billStatus?: WorkspaceBillStatus;
  usageThresholds?: Partial<Record<UsageRecordCategory, IUsageThreshold>>;
  usageThresholdLocks?: Partial<Record<UsageRecordCategory, IUsageThresholdLock>>;
}

export type IPublicWorkspace = IWorkspace;
