import {ObjectValues} from '../utils/types';
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

export const WorkspaceBillStatusMap = {
  Ok: 'ok',
  GracePeriod: 'gracePeriod',
  BillOverdue: 'billOverdue',
} as const;

export type WorkspaceBillStatus = ObjectValues<typeof WorkspaceBillStatusMap>;
export type UsageThresholdsByCategory = Partial<
  Record<UsageRecordCategory, UsageThreshold>
>;
export type UsageThresholdLocksByCategory = Partial<
  Record<UsageRecordCategory, UsageThresholdLock>
>;

export interface Workspace extends WorkspaceResource {
  /** Human readable name of the workspace */
  name: string;
  /** URL compatible name of the workspace */
  rootname: string;
  description?: string;
  publicPermissionGroupId: string;
  billStatusAssignedAt: number;
  billStatus: WorkspaceBillStatus;
  usageThresholds: UsageThresholdsByCategory;
  usageThresholdLocks: UsageThresholdLocksByCategory;

  /** configs */
  enableFileVersioning?: boolean;
  deleteInExternalBackend?: boolean;
  renameInExternalBackend?: boolean;
}

export type PublicWorkspace = ConvertAgentToPublicAgent<Workspace>;
export type PublicUsageThreshold = ConvertAgentToPublicAgent<UsageThreshold>;
export type PublicUsageThresholdLock = ConvertAgentToPublicAgent<UsageThresholdLock>;
