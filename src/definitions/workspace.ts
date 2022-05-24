import {IAgent} from './system';
import {UsageRecordLabel} from './usageRecord';

export interface IUsageThresholdByLabel {
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  label: UsageRecordLabel;
  usage?: number;
  price?: number;
  pricePerUnit: number;
}

export interface ITotalUsageThreshold {
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  price: number;
}

export enum WorkspaceUsageStatus {
  Normal = 0,
  UsageExceeded = 1,
  GracePeriod = 2,
  Locked = 3,
}

export interface IWorkspace {
  resourceId: string;
  createdBy: IAgent;
  createdAt: Date | string;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  name: string;
  description?: string;
  publicPresetId?: string;
  usageStatusAssignedAt?: Date | string;
  usageStatus: WorkspaceUsageStatus;
  totalUsageThreshold?: ITotalUsageThreshold;
  usageThresholds: IUsageThresholdByLabel[];
}

export type IPublicWorkspace = IWorkspace;
