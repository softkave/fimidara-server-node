import {JobStatus} from '../../../definitions/job';
import {Endpoint} from '../../types';

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
