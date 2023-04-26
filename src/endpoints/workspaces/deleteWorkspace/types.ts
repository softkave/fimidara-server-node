import {BaseContextType} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export type DeleteWorkspaceEndpoint = Endpoint<
  BaseContextType,
  EndpointOptionalWorkspaceIDParam,
  LongRunningJobResult
>;
