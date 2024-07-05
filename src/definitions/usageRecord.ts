import {ValueOf} from 'type-fest';
import {FimidaraPermissionAction} from './permissionItem.js';
import {
  FimidaraResourceType,
  PublicWorkspaceResource,
  ToPublicDefinitions,
  WorkspaceResource,
} from './system.js';

export const kUsageRecordCategory = {
  total: 'total',
  storage: 'storage',
  storageEverConsumed: 'storageEver',
  bandwidthIn: 'bin',
  bandwidthOut: 'bout',
  // Request : 'request',
  // DatabaseObject : 'dbObject',
} as const;

export type UsageRecordCategory = ValueOf<typeof kUsageRecordCategory>;

export const kUsageRecordArtifactType = {
  file: 'file',
  // DatabaseObject : 'dbObject',
} as const;

export type UsageRecordArtifactType = ValueOf<typeof kUsageRecordArtifactType>;

export interface UsageRecordArtifact {
  type: UsageRecordArtifactType;
  resourceType?: FimidaraResourceType;
  action?: FimidaraPermissionAction;
  artifact: FileUsageRecordArtifact | BandwidthUsageRecordArtifact;
}

export const kUsageRecordFulfillmentStatus = {
  /** Default status */
  undecided: 'undecided',
  /** Usage record has been fulfilled */
  fulfilled: 'fulfilled',
  /** Usage record has not been fulfilled */
  dropped: 'dropped',
} as const;

export type UsageRecordFulfillmentStatus = ValueOf<
  typeof kUsageRecordFulfillmentStatus
>;

export const kUsageRecordDropReason = {
  exceedsUsage: 'exceedsUsage',
  billOverdue: 'billOverdue',
} as const;

export type UsageRecordDropReason = ValueOf<typeof kUsageRecordDropReason>;

export const kUsageSummationType = {
  /** Individual record */
  instance: 'instance',
  /** Usage record summed up in a month */
  month: 'month',
} as const;

export type UsageSummationType = ValueOf<typeof kUsageSummationType>;

export interface UsageRecord extends WorkspaceResource {
  category: UsageRecordCategory;

  /**
   * Usage is count for requests and db objects usage is bytes for storage,
   * bandwidth in, and bandwidth out.
   */
  usage: number;
  usageCost: number;
  status: UsageRecordFulfillmentStatus;
  summationType: UsageSummationType;

  /** Summation level 1 only. */
  artifacts: UsageRecordArtifact[];
  dropReason?: UsageRecordDropReason;
  dropMessage?: string;

  /** Summation level 2 only. */
  month: number;
  year: number;
  /** whether it carries over from month to month */
  persistent: boolean;
}

export type PublicUsageRecord = PublicWorkspaceResource &
  ToPublicDefinitions<
    Pick<
      UsageRecord,
      'category' | 'usage' | 'usageCost' | 'status' | 'month' | 'year'
    >
  >;

export interface FileUsageRecordArtifact {
  fileId?: string;
  filepath: string[];
  oldFileSize?: number;
  requestId: string;
}

export interface BandwidthUsageRecordArtifact {
  fileId?: string;
  filepath: string[];
  requestId: string;
}

// export interface DatabaseObjectUsageRecordArtifact {
//   resourceId: string;
//   requestId: string;
// }
