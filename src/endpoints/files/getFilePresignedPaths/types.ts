import {FileMatcher} from '../../../definitions/file';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export type GetFilePresignedPathsEndpointParams = EndpointOptionalWorkspaceIDParam & {
  files?: FileMatcher[];
};

export type GetFilePresignedPathsItem = {filepath: string} & {
  path: string;
};

export interface GetFilePresignedPathsEndpointResult {
  paths: GetFilePresignedPathsItem[];
}

export type GetFilePresignedPathsEndpoint = Endpoint<
  BaseContextType,
  GetFilePresignedPathsEndpointParams,
  GetFilePresignedPathsEndpointResult
>;
