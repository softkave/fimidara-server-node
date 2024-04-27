import {FileMatcher} from '../../../definitions/file';
import {FimidaraPermissionAction} from '../../../definitions/permissionItem';
import {Endpoint} from '../../types';

export type IssuePresignedPathEndpointParams = FileMatcher & {
  expires?: number;
  duration?: number;
  usageCount?: number;
  /** Permissions allowed on the generated presigned path. */
  action?: FimidaraPermissionAction | FimidaraPermissionAction[];
  // downloadUsageCount?: number;
  // uploadUsageCount?: number;
  // origin?: string | string[];
  // userAgent?: string | string[];
  // ip?: string | string[];
  // reuseExisting?: boolean;
};

export interface IssuePresignedPathEndpointResult {
  path: string;
}

export type IssuePresignedPathEndpoint = Endpoint<
  IssuePresignedPathEndpointParams,
  IssuePresignedPathEndpointResult
>;
