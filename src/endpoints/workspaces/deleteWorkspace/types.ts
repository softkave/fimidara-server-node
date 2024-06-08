import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export type DeleteWorkspaceEndpoint = Endpoint<
  EndpointOptionalWorkspaceIDParam,
  LongRunningJobResult
>;
