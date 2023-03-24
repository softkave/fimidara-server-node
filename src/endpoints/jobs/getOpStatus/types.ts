import {JobStatus} from '../../../definitions/job';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';

export interface IGetJobStatusEndpointParams extends IEndpointOptionalWorkspaceIDParam {
  jobId: string;
}

export interface IGetJobStatusEndpointResult {
  status: JobStatus;
}

export type GetJobStatusEndpoint = Endpoint<
  IBaseContext,
  IGetJobStatusEndpointParams,
  IGetJobStatusEndpointResult
>;
