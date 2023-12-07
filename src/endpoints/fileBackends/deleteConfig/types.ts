import {BaseContextType} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {
  DeleteResourceCascadeFnDefaultArgs,
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
} from '../../types';

export interface DeleteFileBackendConfigEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  configId: string;
}

export type DeleteFileBackendConfigEndpoint = Endpoint<
  BaseContextType,
  DeleteFileBackendConfigEndpointParams,
  LongRunningJobResult
>;

export type DeleteFileBackendConfigCascadeFnsArgs = DeleteResourceCascadeFnDefaultArgs & {
  secretId: string;
};
