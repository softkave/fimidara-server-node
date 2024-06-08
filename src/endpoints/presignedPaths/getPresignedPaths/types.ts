import {FileMatcher} from '../../../definitions/file.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export type GetPresignedPathsForFilesEndpointParams = EndpointOptionalWorkspaceIDParam & {
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
