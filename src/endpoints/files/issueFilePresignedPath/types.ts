import {FileMatcher} from '../../../definitions/file';
import {PermissionAction} from '../../../definitions/permissionItem';
import {Endpoint} from '../../types';

export type IssueFilePresignedPathEndpointParams = FileMatcher & {
  expires?: number;
  duration?: number;
  usageCount?: number;
  /** Permissions allowed on the generated presigned path. */
  action?: PermissionAction[];
  // downloadUsageCount?: number;
  // uploadUsageCount?: number;
  // origin?: string | string[];
  // userAgent?: string | string[];
  // ip?: string | string[];
  // reuseExisting?: boolean;
};

export interface IssueFilePresignedPathEndpointResult {
  path: string;
}

export type IssueFilePresignedPathEndpoint = Endpoint<
  IssueFilePresignedPathEndpointParams,
  IssueFilePresignedPathEndpointResult
>;
