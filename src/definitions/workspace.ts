import {ValueOf} from 'type-fest';
import {Agent, ToPublicDefinitions, WorkspaceResource} from './system.js';
import {UsageRecordCategory} from './usageRecord.js';

export interface UsageThreshold {
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  category: UsageRecordCategory;
  /** Price in USD */
  budget: number;
  /** Usage depends on category */
  usage: number;
}

export const kWorkspaceBillStatusMap = {
  ok: 'ok',
  gracePeriod: 'gracePeriod',
  billOverdue: 'billOverdue',
} as const;

export type WorkspaceBillStatus = ValueOf<typeof kWorkspaceBillStatusMap>;
export type UsageThresholdsByCategory = Partial<
  Record<UsageRecordCategory, UsageThreshold>
>;

export interface IRootLevelWorkspaceData {
  publicPermissionGroupId: string;
  billStatusAssignedAt: number;
  billStatus: WorkspaceBillStatus;
  usageThresholds: UsageThresholdsByCategory;
}

export interface Workspace extends WorkspaceResource {
  /** Human readable name of the workspace */
  name: string;
  /** URL compatible name of the workspace */
  rootname: string;
  rootnamepath?: string[];
  description?: string;
}

export interface IRootLevelWorkspace
  extends Workspace,
    IRootLevelWorkspaceData {}

export type PublicWorkspace = ToPublicDefinitions<Workspace>;
export type PublicUsageThreshold = ToPublicDefinitions<UsageThreshold>;
