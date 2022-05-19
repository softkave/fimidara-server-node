import {IAgent} from './system';

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

  /**
   * File ID when type is File
   * Request URL when type is RequestURL
   * Database object resource ID when type is DatabaseObject
   */
  artifact: any;
}

export interface IUsageRecord {
  resourceId: string;
  createdAt: Date | string;
  createdBy: IAgent;
  workspaceId: string;
  label: UsageRecordLabel;
  usage: number;
  artifacts: IUsageRecordArtifact[];
}
