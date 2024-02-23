import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export type DeleteWorkspaceEndpoint = Endpoint<
  EndpointOptionalWorkspaceIDParam,
  LongRunningJobResult
>;
