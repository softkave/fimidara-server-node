import {PublicFileBackendMount} from '../../../definitions/fileBackend';
import {BaseContextType} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export type UpdateFileBackendMountInput = {
  folderpath?: string[];
  index?: number;
  mountedFrom?: string[];
  configId?: string;
  name?: string;
  description?: string;
};

export type UpdateFileBackendMountEndpointParams = EndpointOptionalWorkspaceIDParam & {
  mount: UpdateFileBackendMountInput;
  mountId: string;
};

export interface UpdateFileBackendMountEndpointResult extends LongRunningJobResult {
  mount: PublicFileBackendMount;
}

export type UpdateFileBackendMountEndpoint = Endpoint<
  BaseContextType,
  UpdateFileBackendMountEndpointParams,
  UpdateFileBackendMountEndpointResult
>;
