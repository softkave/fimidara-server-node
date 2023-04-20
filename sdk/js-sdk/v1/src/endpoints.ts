// This file is auto-generated, do not modify directly.
// Reach out to @abayomi to suggest changes.

import {
  AddPermissionItemsEndpointRequestParams,
  AddPermissionItemsEndpointResult,
  AddWorkspaceEndpointRequestParams,
  AddWorkspaceEndpointResult,
  ReadFileEndpointRequestParams,
  ReadFileEndpointResult,
} from './types';
import {EndpointsBase, invokeEndpoint} from './utils';

class FilesEndpoints extends EndpointsBase {
  readFile = async (
    props: ReadFileEndpointRequestParams
  ): Promise<ReadFileEndpointResult> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props.body,
      formdata: undefined,
      path: '/v1/files/readFile',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: response.body as any,
    };
    return result;
  };
}
class WorkspacesEndpoints extends EndpointsBase {
  addWorkspace = async (
    props: AddWorkspaceEndpointRequestParams
  ): Promise<AddWorkspaceEndpointResult> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props.body,
      formdata: undefined,
      path: '/v1/workspaces/addWorkspace',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}
class PermissionItemsEndpoints extends EndpointsBase {
  addItems = async (
    props: AddPermissionItemsEndpointRequestParams
  ): Promise<AddPermissionItemsEndpointResult> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props.body,
      formdata: undefined,
      path: '/v1/permissionItems/addItems',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}
export class FimidaraEndpoints extends EndpointsBase {
  files = new FilesEndpoints(this.config);
  workspaces = new WorkspacesEndpoints(this.config);
  permissionItems = new PermissionItemsEndpoints(this.config);
}
