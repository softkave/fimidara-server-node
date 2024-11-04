import {FileMatcher} from '../../../definitions/file.js';
import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface DeleteFileEndpointParams
  extends FileMatcher,
    EndpointOptionalWorkspaceIdParam {}

export type DeleteFileEndpoint = Endpoint<
  DeleteFileEndpointParams,
  LongRunningJobResult
>;
