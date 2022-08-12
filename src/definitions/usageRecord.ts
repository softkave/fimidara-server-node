import {AppResourceType, BasicCRUDActions, IAgent} from './system';

export enum UsageRecordCategory {
  Storage = 'storage',
  BandwidthIn = 'bandwidth-in',
  BandwidthOut = 'bandwidth-out',
  // Request = 'request',
  // DatabaseObject = 'db-object',
  Total = 'total',
}

export enum UsageRecordArtifactType {
  File = 'file',
  // DatabaseObject = 'db-object',
}

export interface IUsageRecordArtifact {
  type: UsageRecordArtifactType;
  resourceType?: AppResourceType;
  action?: BasicCRUDActions;
  artifact: any;
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

export interface IUsageRecord {
  resourceId: string;
  workspaceId: string;
  category: UsageRecordCategory;
  createdBy: IAgent;
  createdAt: Date | string;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: Date | string;

  // usage is count for requests and db objects
  // usage is bytes for storage, bandwidth in, and bandwidth out
  usage: number;
  usageCost: number;
  fulfillmentStatus: UsageRecordFulfillmentStatus;
  summationType: UsageSummationType;

  // summation level 1
  artifacts: IUsageRecordArtifact[];
  dropReason?: UsageRecordDropReason;
  dropMessage?: string;

  // summation level 2
  month: number;
  year: number;
}

export type IPublicUsageRecord = IUsageRecord;

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
//   startDate: Date | string;
//   endDate: Date | string;
//   month: number;
//   year: number;
//   createdAt: Date | string;
//   createdBy: IAgent;
// }

// export interface IUsageRecordCost {
//   resourceId: string;
//   costPerUnit: number;
//   createdAt: Date | string;
//   createdBy: IAgent;
//   category: UsageRecordCategory;
//   effectiveDate: Date | string;
// }
