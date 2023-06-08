import {JobStatus} from '../../../definitions/job';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface GetJobStatusEndpointParams {
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
