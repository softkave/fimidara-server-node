import {IAgent} from './system';
import {UsageThresholdCategory} from './usageRecord';

export interface IUsageThreshold {
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  category: UsageThresholdCategory;
  price: number; // price in USD
}

export interface IUsageThresholdLock {
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  category: UsageThresholdCategory;
  locked: boolean;
}

export enum WorkspaceBillStatus {
  Ok = 0,
  GracePeriod = 2,
  BillOverdue = 3,
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
  usageThresholds?: Partial<Record<UsageThresholdCategory, IUsageThreshold>>;
  usageThresholdLocks?: Partial<
    Record<UsageThresholdCategory, IUsageThresholdLock>
  >;
}

export type IPublicWorkspace = Omit<IWorkspace, 'usageThresholdLocks'>;
