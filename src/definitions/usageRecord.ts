import {AppResourceType, BasicCRUDActions, IAgent} from './system';

export enum UsageRecordCategory {
  Storage = 'storage',
  BandwidthIn = 'bandwidth-in',
  BandwidthOut = 'bandwidth-out',
  Request = 'request',
  DatabaseObject = 'db-object',
}

export type UsageThresholdCategory = UsageRecordCategory | 'total';
export enum UsageRecordArtifactType {
  File = 'file',
  RequestURL = 'request-url',
  DatabaseObject = 'db-object',
}

export interface IUsageRecordArtifact {
  type: UsageRecordArtifactType;
  resourceType?: AppResourceType;
  action?: BasicCRUDActions;

  /**
   * File ID when type is File
   * Request URL when type is RequestURL
   * Database object resource ID when type is DatabaseObject
   */
  artifact: any;
}

export enum UsageRecordSummationLevel {
  // individual usage records
  One = 1,
  // usage records grouped by billing period
  Two = 2,
  // total usage record for a workspace for a billing period
  Three = 3,
}

export enum UsageRecordFulfillmentStatus {
  // Default status
  Undecided = 0,
  // usage record has been fulfilled
  Fulfilled = 1,
  // usage record has not been fulfilled
  Dropped = 2,
}

export enum UsageRecordDropReason {
  UsageExceeded = 'usage-exceeded',
  ExceedsRemaining = 'exceeds-remaining',
  BillOverdue = 'bill-overdue',
  Other = 'other',
}

export interface IUsageRecord {
  resourceId: string;
  createdAt: Date | string;
  createdBy: IAgent;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: Date | string;
  workspaceId: string;
  category: UsageRecordCategory;

  // usage is price in USD for sum level 3
  // usage is count for requests and db objects
  // usage is bytes for storage, bandwidth in, and bandwidth out
  usage: number;
  artifacts: IUsageRecordArtifact[];
  summationLevel: UsageRecordSummationLevel;
  fulfillmentStatus: UsageRecordFulfillmentStatus;
  dropReason?: UsageRecordDropReason;
  dropMessage?: string;
  dropLabel?: UsageThresholdCategory;
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

export interface IRequestUsageRecordArtifact {
  requestId: string;
  url: string;
}

export interface IDatabaseObjectUsageRecordArtifact {
  resourceId: string;
  requestId: string;
}
