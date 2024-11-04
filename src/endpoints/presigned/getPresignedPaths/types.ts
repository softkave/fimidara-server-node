import {FileMatcher} from '../../../definitions/file.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface GetPresignedPathsForFilesEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  files?: FileMatcher[];
}

export type GetPresignedPathsForFilesItem = {filepath: string} & {
  path: string;
};

export interface GetPresignedPathsForFilesEndpointResult {
  paths: GetPresignedPathsForFilesItem[];
}

export type GetPresignedPathsForFilesEndpoint = Endpoint<
  GetPresignedPathsForFilesEndpointParams,
  GetPresignedPathsForFilesEndpointResult
>;
