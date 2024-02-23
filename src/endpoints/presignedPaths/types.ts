import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {GetPresignedPathsForFilesEndpoint} from './getPresignedPaths/types';
import {IssuePresignedPathEndpoint} from './issuePresignedPath/types';

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
