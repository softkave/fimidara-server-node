import {PermissionAction} from './permissionItem';
import {
  AppResourceType,
  ConvertAgentToPublicAgent,
  PublicWorkspaceResource,
  WorkspaceResource,
} from './system';

export enum UsageRecordCategory {
  Total = 'total',
  Storage = 'storage',
  BandwidthIn = 'bin',
  BandwidthOut = 'bout',
  // Request = 'request',
  // DatabaseObject = 'dbObject',
}

export enum UsageRecordArtifactType {
  File = 'file',
  // DatabaseObject = 'dbObject',
}

export interface UsageRecordArtifact {
  type: UsageRecordArtifactType;
  resourceType?: AppResourceType;
  action?: PermissionAction;
  artifact: FileUsageRecordArtifact | BandwidthUsageRecordArtifact;
}

export enum UsageRecordFulfillmentStatus {
  // Default status
  Undecided = 'undecided',
  // usage record has been fulfilled
  Fulfilled = 'fulfilled',
  // usage record has not been fulfilled
  Dropped = 'dropped',
}

export enum UsageRecordDropReason {
  UsageExceeded = 'usage-exceeded',
  ExceedsRemainingUsage = 'exceeds-remaining-usage',
  BillOverdue = 'bill-overdue',
}

export enum UsageSummationType {
  One = 1,
  Two = 2,
}

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
  ConvertAgentToPublicAgent<
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
