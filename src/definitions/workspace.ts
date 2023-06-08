import {Agent, ConvertAgentToPublicAgent, WorkspaceResource} from './system';
import {UsageRecordCategory} from './usageRecord';

export interface UsageThreshold {
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  category: UsageRecordCategory;
  budget: number; // price in USD
}

export interface UsageThresholdLock {
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  category: UsageRecordCategory;
  locked: boolean;
}

export enum WorkspaceBillStatus {
  Ok = 'ok',
  GracePeriod = 'gracePeriod',
  BillOverdue = 'billOverdue',
}

export interface Workspace extends WorkspaceResource {
  /**
   * Human readable name of the workspace.
   */
  name: string;

  /**
   * URL compatible name of the workspace.
   */
  rootname: string;
  description?: string;
  publicPermissionGroupId: string;
  billStatusAssignedAt: number;
  billStatus: WorkspaceBillStatus;
  usageThresholds: Partial<Record<UsageRecordCategory, UsageThreshold>>;
  usageThresholdLocks: Partial<Record<UsageRecordCategory, UsageThresholdLock>>;
}

export type PublicWorkspace = ConvertAgentToPublicAgent<Workspace>;
export type PublicUsageThreshold = ConvertAgentToPublicAgent<UsageThreshold>;
export type PublicUsageThresholdLock = ConvertAgentToPublicAgent<UsageThresholdLock>;
