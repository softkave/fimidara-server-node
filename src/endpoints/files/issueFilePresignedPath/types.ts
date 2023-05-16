import {FileMatcher} from '../../../definitions/file';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export type IssueFilePresignedPathEndpointParams = FileMatcher & {
  expires?: number;
  duration?: number;
  usageCount?: number;
};

export interface IssueFilePresignedPathEndpointResult {
  path: string;
}

export type IssueFilePresignedPathEndpoint = Endpoint<
  BaseContextType,
  IssueFilePresignedPathEndpointParams,
  IssueFilePresignedPathEndpointResult
>;
