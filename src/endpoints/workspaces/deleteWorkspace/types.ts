import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';

export type DeleteWorkspaceEndpoint = Endpoint<IBaseContext, IEndpointOptionalWorkspaceIDParam>;
