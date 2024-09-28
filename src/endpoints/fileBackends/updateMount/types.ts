import {PublicFileBackendMount} from '../../../definitions/fileBackend.js';
import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export type UpdateFileBackendMountInput = {
  folderpath?: string;
  index?: number;
  mountedFrom?: string;
  configId?: string;
  name?: string;
  description?: string;
};

export type UpdateFileBackendMountEndpointParams =
  EndpointOptionalWorkspaceIDParam & {
    mount: UpdateFileBackendMountInput;
    mountId: string;
  };

export interface UpdateFileBackendMountEndpointResult
  extends LongRunningJobResult {
  mount: PublicFileBackendMount;
}

export type UpdateFileBackendMountEndpoint = Endpoint<
  UpdateFileBackendMountEndpointParams,
  UpdateFileBackendMountEndpointResult
>;
