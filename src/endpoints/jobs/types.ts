import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {
  GetJobStatusEndpoint,
  GetJobStatusEndpointParams,
  GetJobStatusEndpointResult,
} from './getJobStatus/types';

export interface LongRunningJobResult {
  jobId: string;
}

export type GetJobStatusHttpEndpoint = HttpEndpoint<
  GetJobStatusEndpoint,
  GetJobStatusEndpointParams,
  GetJobStatusEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;

export type JobsExportedEndpoints = {
  getJobStatus: ExportedHttpEndpointWithMddocDefinition<GetJobStatusHttpEndpoint>;
};
