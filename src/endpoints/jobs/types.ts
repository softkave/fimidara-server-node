import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {GetJobStatusEndpoint} from './getJobStatus/types';

export interface LongRunningJobResult {
  jobId: string;
}

export type GetJobStatusHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetJobStatusEndpoint>;

export type JobsExportedEndpoints = {
  getJobStatus: GetJobStatusHttpEndpoint;
};
