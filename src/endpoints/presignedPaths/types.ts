import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {GetPresignedPathsForFilesEndpoint} from './getPresignedPaths/types.js';
import {IssuePresignedPathEndpoint} from './issuePresignedPath/types.js';

export type IssuePresignedPathHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<IssuePresignedPathEndpoint>;
export type GetPresignedPathsForFilesHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetPresignedPathsForFilesEndpoint>;

export type PresignedPathsExportedEndpoints = {
  issuePresignedPath: IssuePresignedPathHttpEndpoint;
  getPresignedPathsForFiles: GetPresignedPathsForFilesHttpEndpoint;
};

export type FileMatcherPathParameters = {
  filepathOrId?: string;
};
