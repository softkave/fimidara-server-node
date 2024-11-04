import {JobStatus} from '../../../definitions/job.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface GetJobStatusEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  jobId: string;
}

export interface GetJobStatusEndpointResult {
  status: JobStatus;
}

export type GetJobStatusEndpoint = Endpoint<
  GetJobStatusEndpointParams,
  GetJobStatusEndpointResult
>;
