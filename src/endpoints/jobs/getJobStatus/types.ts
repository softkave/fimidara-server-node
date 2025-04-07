import {JobStatus} from '../../../definitions/job.js';
import {Endpoint} from '../../types.js';

export interface GetJobStatusEndpointParams {
  jobId: string;
}

export interface GetJobStatusEndpointResult {
  status: JobStatus;
  errorMessage?: string;
}

export type GetJobStatusEndpoint = Endpoint<
  GetJobStatusEndpointParams,
  GetJobStatusEndpointResult
>;
