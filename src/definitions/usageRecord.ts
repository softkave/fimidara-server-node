import {AppResourceType, BasicCRUDActions, IAgent} from './system';

export enum UsageRecordLabel {
  Storage = 'storage',
  BandwidthIn = 'bandwidth-in',
  BandwidthOut = 'bandwidth-out',
  Request = 'request',
  DatabaseObject = 'db-object',
}

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
}

export enum UsageRecordFulfillmentStatus {
  // usage record has not been fulfilled
  Unfulfilled = 0,
  // usage record has been fulfilled
  Fulfilled = 1,
}

export interface IUsageRecord {
  resourceId: string;
  createdAt: Date | string;
  createdBy: IAgent;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: Date | string;
  workspaceId: string;
  label: UsageRecordLabel;
  usage: number;
  artifacts: IUsageRecordArtifact[];
  summationLevel: UsageRecordSummationLevel;
  fulfillmentStatus: UsageRecordFulfillmentStatus;
}

export interface IFileUsageRecordArtifact {
  fileId: string;
  filepath: string;
  oldFileSize?: number;
  requestId: string;
}

export interface IBandwidthUsageRecordArtifact {
  fileId: 'file-id';
  filepath: '/path/to/file';
  requestId: string;
}

export interface IRequestUsageRecordArtifact {
  requestId: string;
  url: '/files/getFile';
}

export interface IDatabaseObjectUsageRecordArtifact {
  resourceId: string;
  requestId: string;
}

export type IPublicUsageRecord = IUsageRecord;
