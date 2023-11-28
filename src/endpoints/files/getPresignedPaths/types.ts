import {FileMatcher} from '../../../definitions/file';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

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
  BaseContextType,
  GetPresignedPathsForFilesEndpointParams,
  GetPresignedPathsForFilesEndpointResult
>;
