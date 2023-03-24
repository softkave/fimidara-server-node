import {IBaseContext} from '../../contexts/types';
import {ILongRunningJobResult} from '../../jobs/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';

export type DeleteWorkspaceEndpoint = Endpoint<
  IBaseContext,
  IEndpointOptionalWorkspaceIDParam,
  ILongRunningJobResult
>;
