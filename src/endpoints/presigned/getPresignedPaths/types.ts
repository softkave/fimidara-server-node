import {FileMatcher} from '../../../definitions/file.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export type GetPresignedPathsForFilesEndpointParams =
  EndpointOptionalWorkspaceIdParam & {
    files?: FileMatcher[];
  };

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
