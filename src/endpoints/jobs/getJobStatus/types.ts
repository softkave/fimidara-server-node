import {JobStatus} from '../../../definitions/job';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface GetJobStatusEndpointParams extends EndpointOptionalWorkspaceIDParam {
  jobId: string;
}

export interface GetJobStatusEndpointResult {
  status: JobStatus;
}

export type GetJobStatusEndpoint = Endpoint<
  BaseContextType,
  GetJobStatusEndpointParams,
  GetJobStatusEndpointResult
>;
