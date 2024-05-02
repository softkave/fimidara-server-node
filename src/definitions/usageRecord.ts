import {ObjectValues} from '../utils/types.js';
import {FimidaraPermissionAction} from './permissionItem.js';
import {
  FimidaraResourceType,
  PublicWorkspaceResource,
  ToPublicDefinitions,
  WorkspaceResource,
} from './system.js';

export const UsageRecordCategoryMap = {
  Total: 'total',
  Storage: 'storage',
  BandwidthIn: 'bin',
  BandwidthOut: 'bout',
  // Request : 'request',
  // DatabaseObject : 'dbObject',
} as const;

export type UsageRecordCategory = ObjectValues<typeof UsageRecordCategoryMap>;

export const UsageRecordArtifactTypeMap = {
  File: 'file',
  // DatabaseObject : 'dbObject',
} as const;

export type UsageRecordArtifactType = ObjectValues<typeof UsageRecordArtifactTypeMap>;

export interface UsageRecordArtifact {
  type: UsageRecordArtifactType;
  resourceType?: FimidaraResourceType;
  action?: FimidaraPermissionAction;
  artifact: FileUsageRecordArtifact | BandwidthUsageRecordArtifact;
}

export const UsageRecordFulfillmentStatusMap = {
  // Default status
  Undecided: 'undecided',
  // usage record has been fulfilled
  Fulfilled: 'fulfilled',
  // usage record has not been fulfilled
  Dropped: 'dropped',
} as const;

export type UsageRecordFulfillmentStatus = ObjectValues<
  typeof UsageRecordFulfillmentStatusMap
>;

export const UsageRecordDropReasonMap = {
  UsageExceeded: 'usageExceeded',
  ExceedsRemainingUsage: 'exceedsRemainingUsage',
  BillOverdue: 'billOverdue',
} as const;

export type UsageRecordDropReason = ObjectValues<typeof UsageRecordDropReasonMap>;

export const UsageSummationTypeMap = {
  /** Individual record */
  Instance: 'instance',
  /** Usage record summed up in a month */
  Month: 'month',
} as const;

export type UsageSummationType = ObjectValues<typeof UsageSummationTypeMap>;

export interface UsageRecord extends WorkspaceResource {
  category: UsageRecordCategory;

  /**
   * Usage is count for requests and db objects usage is bytes for storage,
   * bandwidth in, and bandwidth out.
   */
  usage: number;
  usageCost: number;
  fulfillmentStatus: UsageRecordFulfillmentStatus;
  summationType: UsageSummationType;

  /** Summation level 1 only. */
  artifacts: UsageRecordArtifact[];
  dropReason?: UsageRecordDropReason;
  dropMessage?: string;

  /** Summation level 2 only. */
  month: number;
  year: number;
}

export type PublicUsageRecord = PublicWorkspaceResource &
  ToPublicDefinitions<
    Pick<
      UsageRecord,
      'category' | 'usage' | 'usageCost' | 'fulfillmentStatus' | 'month' | 'year'
    >
  >;

export interface FileUsageRecordArtifact {
  fileId: string;
  filepath: string;
  oldFileSize?: number;
  requestId: string;
}

export interface BandwidthUsageRecordArtifact {
  fileId: string;
  filepath: string;
  requestId: string;
}

export interface DatabaseObjectUsageRecordArtifact {
  resourceId: string;
  requestId: string;
}

// export interface UsageRecordReportingPeriod {
//   resourceId: string;
//   startDate: number;
//   endDate: number;
//   month: number;
//   year: number;
//   createdAt: number;
//   createdBystring
// }

// export interface UsageRecordCost {
//   resourceId: string;
//   costPerUnit: number;
//   createdAt: number;
//   createdBystring
//   category: UsageRecordCategory;
//   effectiveDate: number;
// }
