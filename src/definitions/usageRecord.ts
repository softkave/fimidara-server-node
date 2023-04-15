import {
  AppActionType,
  AppResourceType,
  ConvertAgentToPublicAgent,
  IPublicWorkspaceResource,
  IWorkspaceResource,
} from './system';

export enum UsageRecordCategory {
  Storage = 's',
  BandwidthIn = 'bin',
  BandwidthOut = 'bout',
  // Request = 'request',
  // DatabaseObject = 'dbObject',
  Total = 't',
}

export enum UsageRecordArtifactType {
  File = 'file',
  // DatabaseObject = 'db-object',
}

export interface IUsageRecordArtifact {
  type: UsageRecordArtifactType;
  resourceType?: AppResourceType;
  action?: AppActionType;
  artifact: IFileUsageRecordArtifact | IBandwidthUsageRecordArtifact;
}

export enum UsageRecordFulfillmentStatus {
  // Default status
  Undecided = 'u',
  // usage record has been fulfilled
  Fulfilled = 'f',
  // usage record has not been fulfilled
  Dropped = 'd',
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

export interface IUsageRecord extends IWorkspaceResource {
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
  artifacts: IUsageRecordArtifact[];
  dropReason?: UsageRecordDropReason;
  dropMessage?: string;

  /** Summation level 2 only. */
  month: number;
  year: number;
}

export type IPublicUsageRecord = IPublicWorkspaceResource &
  ConvertAgentToPublicAgent<
    Pick<IUsageRecord, 'category' | 'usage' | 'usageCost' | 'fulfillmentStatus' | 'month' | 'year'>
  >;

export interface IFileUsageRecordArtifact {
  fileId: string;
  filepath: string;
  oldFileSize?: number;
  requestId: string;
}

export interface IBandwidthUsageRecordArtifact {
  fileId: string;
  filepath: string;
  requestId: string;
}

export interface IDatabaseObjectUsageRecordArtifact {
  resourceId: string;
  requestId: string;
}

// export interface IUsageRecordReportingPeriod {
//   resourceId: string;
//   startDate: number;
//   endDate: number;
//   month: number;
//   year: number;
//   createdAt: number;
//   createdBystring
// }

// export interface IUsageRecordCost {
//   resourceId: string;
//   costPerUnit: number;
//   createdAt: number;
//   createdBystring
//   category: UsageRecordCategory;
//   effectiveDate: number;
// }
