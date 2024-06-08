import {JobStatus} from '../../../definitions/job.js';
import {Endpoint} from '../../types.js';

export interface GetJobStatusEndpointParams {
  jobId: string;
}

export interface GetJobStatusEndpointResult {
  status: JobStatus;
}

export type GetJobStatusEndpoint = Endpoint<
  GetJobStatusEndpointParams,
  GetJobStatusEndpointResult
>;
