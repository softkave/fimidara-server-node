// This file is auto-generated, do not modify directly.
// Reach out to @abayomi to suggest changes.

import {
  invokeEndpoint,
  FimidaraEndpointsBase,
  FimidaraEndpointResult,
  FimidaraEndpointParamsRequired,
  FimidaraEndpointParamsOptional,
} from './utils';
import {
  AddAgentTokenEndpointParams,
  AddAgentTokenEndpointSuccessResult,
  DeleteAgentTokenEndpointParams,
  LongRunningJobResult,
  GetAgentTokenEndpointParams,
  GetAgentTokenEndpointResult,
  GetWorkspaceAgentTokensEndpointParams,
  GetWorkspaceAgentTokensEndpointResult,
  CountWorkspaceAgentTokensEndpointParams,
  CountItemsResult,
  UpdateAgentTokenEndpointParams,
  UpdateAgentTokenEndpointSuccessResult,
  DeleteCollaborationRequestEndpointParams,
  GetCollaborationRequestEndpointParams,
  GetCollaborationRequestEndpointSuccessResult,
  GetUserCollaborationRequestsEndpointParams,
  GetUserCollaborationRequestsEndpointSuccessResult,
  GetWorkspaceCollaborationRequestsEndpointParams,
  GetWorkspaceCollaborationRequestsEndpointSuccessResult,
  CountWorkspaceCollaborationRequestsEndpointParams,
  RespondToCollaborationRequestEndpointParams,
  RespondToCollaborationRequestEndpointSuccessResult,
  RevokeCollaborationRequestEndpointParams,
  RevokeCollaborationRequestEndpointSuccessResult,
  SendCollaborationRequestEndpointParams,
  SendCollaborationRequestEndpointSuccessResult,
  UpdateCollaborationRequestEndpointParams,
  UpdateCollaborationRequestEndpointSuccessResult,
  GetCollaboratorEndpointParams,
  GetCollaboratorEndpointSuccessResult,
  GetWorkspaceCollaboratorsEndpointParams,
  GetWorkspaceCollaboratorsEndpointSuccessResult,
  CountWorkspaceCollaboratorsEndpointParams,
  RevokeCollaboratorEndpointParams,
  DeleteFileEndpointParams,
  GetFileDetailsEndpointParams,
  GetFileDetailsEndpointSuccessResult,
  ReadFileEndpointParams,
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsEndpointSuccessResult,
  UploadFileEndpointParams,
  UploadFileEndpointSuccessResult,
  AddFolderEndpointParams,
  AddFolderEndpointSuccessResult,
  DeleteFolderEndpointParams,
  GetFolderEndpointParams,
  GetFolderEndpointSuccessResult,
  ListFolderContentEndpointParams,
  ListFolderContentEndpointSuccessResult,
  CountFolderContentEndpointParams,
  CountFolderContentEndpointSuccessResult,
  UpdateFolderEndpointParams,
  UpdateFolderEndpointSuccessResult,
  GetJobStatusEndpointParams,
  GetJobStatusEndpointResult,
  AddPermissionGroupEndpointParams,
  AddPermissionGroupEndpointSuccessResult,
  AssignPermissionGroupsEndpointParams,
  DeletePermissionGroupEndpointParams,
  GetPermissionGroupEndpointParams,
  GetPermissionGroupEndpointSuccessResult,
  GetEntityAssignedPermissionGroupsParams,
  GetEntityAssignedPermissionGroupsEndpointSuccessResult,
  GetWorkspacePermissionGroupsEndpointParams,
  GetWorkspacePermissionGroupsEndpointSuccessResult,
  CountWorkspacePermissionGroupsEndpointParams,
  UpdatePermissionGroupEndpointParams,
  UpdatePermissionGroupEndpointSuccessResult,
  AddPermissionItemsEndpointParams,
  DeletePermissionItemsEndpointParams,
  ResourceWrapper,
  GetResourcesEndpointResult,
  GetUsageCostsEndpointResult,
  GetWorkspaceSummedUsageEndpointParams,
  GetWorkspaceSummedUsageEndpointResult,
  CountWorkspaceSummedUsageEndpointParams,
  LoginResult,
  UpdateUserEndpointParams,
  UpdateUserEndpointResult,
  AddWorkspaceEndpointParams,
  AddWorkspaceEndpointSuccessResult,
  DeleteWorkspaceEndpointParams,
  GetUserWorkspacesEndpointParams,
  GetUserWorkspacesEndpointResult,
  GetWorkspaceEndpointParams,
  GetWorkspaceEndpointSuccessResult,
  UpdateWorkspaceEndpointParams,
  UpdateWorkspaceEndpointSuccessResult,
} from './public-types';
import {Readable} from 'isomorphic-form-data';

class AgentTokensEndpoints extends FimidaraEndpointsBase {
  addToken = async (
    props: FimidaraEndpointParamsRequired<AddAgentTokenEndpointParams>
  ): Promise<FimidaraEndpointResult<AddAgentTokenEndpointSuccessResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/agentTokens/addToken',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  deleteToken = async (
    props?: FimidaraEndpointParamsOptional<DeleteAgentTokenEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/agentTokens/deleteToken',
      method: 'DELETE',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  getToken = async (
    props?: FimidaraEndpointParamsOptional<GetAgentTokenEndpointParams>
  ): Promise<FimidaraEndpointResult<GetAgentTokenEndpointResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/agentTokens/getToken',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  getWorkspaceTokens = async (
    props?: FimidaraEndpointParamsOptional<GetWorkspaceAgentTokensEndpointParams>
  ): Promise<FimidaraEndpointResult<GetWorkspaceAgentTokensEndpointResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/agentTokens/getWorkspaceTokens',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  countWorkspaceTokens = async (
    props?: FimidaraEndpointParamsOptional<CountWorkspaceAgentTokensEndpointParams>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/agentTokens/countWorkspaceTokens',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  updateToken = async (
    props: FimidaraEndpointParamsRequired<UpdateAgentTokenEndpointParams>
  ): Promise<FimidaraEndpointResult<UpdateAgentTokenEndpointSuccessResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/agentTokens/updateToken',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}
class CollaborationRequestsEndpoints extends FimidaraEndpointsBase {
  deleteRequest = async (
    props: FimidaraEndpointParamsRequired<DeleteCollaborationRequestEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/collaborationRequests/deleteRequest',
      method: 'DELETE',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  getRequest = async (
    props: FimidaraEndpointParamsRequired<GetCollaborationRequestEndpointParams>
  ): Promise<
    FimidaraEndpointResult<GetCollaborationRequestEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/collaborationRequests/getRequest',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  getUserRequests = async (
    props?: FimidaraEndpointParamsOptional<GetUserCollaborationRequestsEndpointParams>
  ): Promise<
    FimidaraEndpointResult<GetUserCollaborationRequestsEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/collaborationRequests/getUserRequests',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  countUserRequests = async (
    props?: FimidaraEndpointParamsOptional<undefined>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: undefined,
      formdata: undefined,
      path: '/v1/collaborationRequests/countUserRequests',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  getWorkspaceRequests = async (
    props?: FimidaraEndpointParamsOptional<GetWorkspaceCollaborationRequestsEndpointParams>
  ): Promise<
    FimidaraEndpointResult<GetWorkspaceCollaborationRequestsEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/collaborationRequests/getWorkspaceRequests',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  countWorkspaceRequests = async (
    props?: FimidaraEndpointParamsOptional<CountWorkspaceCollaborationRequestsEndpointParams>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/collaborationRequests/countWorkspaceRequests',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  respondToRequest = async (
    props: FimidaraEndpointParamsRequired<RespondToCollaborationRequestEndpointParams>
  ): Promise<
    FimidaraEndpointResult<RespondToCollaborationRequestEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/collaborationRequests/respondToRequest',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  revokeRequest = async (
    props: FimidaraEndpointParamsRequired<RevokeCollaborationRequestEndpointParams>
  ): Promise<
    FimidaraEndpointResult<RevokeCollaborationRequestEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/collaborationRequests/revokeRequest',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  sendRequest = async (
    props: FimidaraEndpointParamsRequired<SendCollaborationRequestEndpointParams>
  ): Promise<
    FimidaraEndpointResult<SendCollaborationRequestEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/collaborationRequests/sendRequest',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  updateRequest = async (
    props: FimidaraEndpointParamsRequired<UpdateCollaborationRequestEndpointParams>
  ): Promise<
    FimidaraEndpointResult<UpdateCollaborationRequestEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/collaborationRequests/updateRequest',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}
class CollaboratorsEndpoints extends FimidaraEndpointsBase {
  getCollaborator = async (
    props: FimidaraEndpointParamsRequired<GetCollaboratorEndpointParams>
  ): Promise<FimidaraEndpointResult<GetCollaboratorEndpointSuccessResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/collaborators/getCollaborator',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  getWorkspaceCollaborators = async (
    props?: FimidaraEndpointParamsOptional<GetWorkspaceCollaboratorsEndpointParams>
  ): Promise<
    FimidaraEndpointResult<GetWorkspaceCollaboratorsEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/collaborators/getWorkspaceCollaborators',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  countWorkspaceCollaborators = async (
    props?: FimidaraEndpointParamsOptional<CountWorkspaceCollaboratorsEndpointParams>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/collaborators/countWorkspaceCollaborators',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  removeCollaborator = async (
    props: FimidaraEndpointParamsRequired<RevokeCollaboratorEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/collaborators/removeCollaborator',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}
class FilesEndpoints extends FimidaraEndpointsBase {
  deleteFile = async (
    props?: FimidaraEndpointParamsOptional<DeleteFileEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/files/deleteFile',
      method: 'DELETE',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  getFileDetails = async (
    props?: FimidaraEndpointParamsOptional<GetFileDetailsEndpointParams>
  ): Promise<FimidaraEndpointResult<GetFileDetailsEndpointSuccessResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/files/getFileDetails',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  readFile = async (
    props?: FimidaraEndpointParamsOptional<ReadFileEndpointParams>
  ): Promise<FimidaraEndpointResult<string | Readable | ReadableStream>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
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
  updateFileDetails = async (
    props: FimidaraEndpointParamsRequired<UpdateFileDetailsEndpointParams>
  ): Promise<
    FimidaraEndpointResult<UpdateFileDetailsEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/files/updateFileDetails',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  uploadFile = async (
    props: FimidaraEndpointParamsRequired<UploadFileEndpointParams>
  ): Promise<FimidaraEndpointResult<UploadFileEndpointSuccessResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: props.body,
      path: '/v1/files/uploadFile',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}
class FoldersEndpoints extends FimidaraEndpointsBase {
  addFolder = async (
    props: FimidaraEndpointParamsRequired<AddFolderEndpointParams>
  ): Promise<FimidaraEndpointResult<AddFolderEndpointSuccessResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/folders/addFolder',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  deleteFolder = async (
    props?: FimidaraEndpointParamsOptional<DeleteFolderEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/folders/deleteFolder',
      method: 'DELETE',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  getFolder = async (
    props?: FimidaraEndpointParamsOptional<GetFolderEndpointParams>
  ): Promise<FimidaraEndpointResult<GetFolderEndpointSuccessResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/folders/getFolder',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  listFolderContent = async (
    props?: FimidaraEndpointParamsOptional<ListFolderContentEndpointParams>
  ): Promise<
    FimidaraEndpointResult<ListFolderContentEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/folders/listFolderContent',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  countFolderContent = async (
    props?: FimidaraEndpointParamsOptional<CountFolderContentEndpointParams>
  ): Promise<
    FimidaraEndpointResult<CountFolderContentEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/folders/countFolderContent',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  updateFolder = async (
    props: FimidaraEndpointParamsRequired<UpdateFolderEndpointParams>
  ): Promise<FimidaraEndpointResult<UpdateFolderEndpointSuccessResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/folders/updateFolder',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}
class ClientLogsEndpoints extends FimidaraEndpointsBase {
  ingestLogs = async (
    props: FimidaraEndpointParamsRequired<GetJobStatusEndpointParams>
  ): Promise<FimidaraEndpointResult<GetJobStatusEndpointResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/clientLogs/ingestLogs',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}
class PermissionGroupsEndpoints extends FimidaraEndpointsBase {
  addPermissionGroup = async (
    props: FimidaraEndpointParamsRequired<AddPermissionGroupEndpointParams>
  ): Promise<
    FimidaraEndpointResult<AddPermissionGroupEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/permissionGroups/addPermissionGroup',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  assignPermissionGroups = async (
    props: FimidaraEndpointParamsRequired<AssignPermissionGroupsEndpointParams>
  ): Promise<FimidaraEndpointResult<undefined>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/permissionGroups/assignPermissionGroups',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  deletePermissionGroup = async (
    props?: FimidaraEndpointParamsOptional<DeletePermissionGroupEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/permissionGroups/deletePermissionGroup',
      method: 'DELETE',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  getPermissionGroup = async (
    props?: FimidaraEndpointParamsOptional<GetPermissionGroupEndpointParams>
  ): Promise<
    FimidaraEndpointResult<GetPermissionGroupEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/permissionGroups/getPermissionGroup',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  getEntityAssignedPermissionGroups = async (
    props: FimidaraEndpointParamsRequired<GetEntityAssignedPermissionGroupsParams>
  ): Promise<
    FimidaraEndpointResult<GetEntityAssignedPermissionGroupsEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/permissionGroups/getEntityAssignedPermissionGroups',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  getWorkspacePermissionGroups = async (
    props?: FimidaraEndpointParamsOptional<GetWorkspacePermissionGroupsEndpointParams>
  ): Promise<
    FimidaraEndpointResult<GetWorkspacePermissionGroupsEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/permissionGroups/getWorkspacePermissionGroups',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  countWorkspacePermissionGroups = async (
    props?: FimidaraEndpointParamsOptional<CountWorkspacePermissionGroupsEndpointParams>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/permissionGroups/countWorkspacePermissionGroups',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  updatePermissionGroup = async (
    props: FimidaraEndpointParamsRequired<UpdatePermissionGroupEndpointParams>
  ): Promise<
    FimidaraEndpointResult<UpdatePermissionGroupEndpointSuccessResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/permissionGroups/updatePermissionGroup',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}
class PermissionItemsEndpoints extends FimidaraEndpointsBase {
  addItems = async (
    props: FimidaraEndpointParamsRequired<AddPermissionItemsEndpointParams>
  ): Promise<FimidaraEndpointResult<undefined>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
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
  deleteItems = async (
    props?: FimidaraEndpointParamsOptional<DeletePermissionItemsEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/permissionItems/deleteItems',
      method: 'DELETE',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}
class ResourcesEndpoints extends FimidaraEndpointsBase {
  getResources = async (
    props: FimidaraEndpointParamsRequired<ResourceWrapper>
  ): Promise<FimidaraEndpointResult<GetResourcesEndpointResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/resources/getResources',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}
class UsageRecordsEndpoints extends FimidaraEndpointsBase {
  getUsageCosts = async (
    props?: FimidaraEndpointParamsOptional<undefined>
  ): Promise<FimidaraEndpointResult<GetUsageCostsEndpointResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: undefined,
      formdata: undefined,
      path: '/v1/usageRecords/getUsageCosts',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  getWorkspaceSummedUsage = async (
    props?: FimidaraEndpointParamsOptional<GetWorkspaceSummedUsageEndpointParams>
  ): Promise<FimidaraEndpointResult<GetWorkspaceSummedUsageEndpointResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/usageRecords/getWorkspaceSummedUsage',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  countWorkspaceSummedUsage = async (
    props?: FimidaraEndpointParamsOptional<CountWorkspaceSummedUsageEndpointParams>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/usageRecords/countWorkspaceSummedUsage',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}
class UsersEndpoints extends FimidaraEndpointsBase {
  getUserData = async (
    props?: FimidaraEndpointParamsOptional<undefined>
  ): Promise<FimidaraEndpointResult<LoginResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: undefined,
      formdata: undefined,
      path: '/v1/users/getUserData',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  updateUser = async (
    props?: FimidaraEndpointParamsOptional<UpdateUserEndpointParams>
  ): Promise<FimidaraEndpointResult<UpdateUserEndpointResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/users/updateUser',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}
class WorkspacesEndpoints extends FimidaraEndpointsBase {
  addWorkspace = async (
    props: FimidaraEndpointParamsRequired<AddWorkspaceEndpointParams>
  ): Promise<FimidaraEndpointResult<AddWorkspaceEndpointSuccessResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
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
  deleteWorkspace = async (
    props?: FimidaraEndpointParamsOptional<DeleteWorkspaceEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/workspaces/deleteWorkspace',
      method: 'DELETE',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  getUserWorkspaces = async (
    props?: FimidaraEndpointParamsOptional<GetUserWorkspacesEndpointParams>
  ): Promise<FimidaraEndpointResult<GetUserWorkspacesEndpointResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/workspaces/getUserWorkspaces',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  countUserWorkspaces = async (
    props?: FimidaraEndpointParamsOptional<undefined>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: undefined,
      formdata: undefined,
      path: '/v1/workspaces/countUserWorkspaces',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  getWorkspace = async (
    props?: FimidaraEndpointParamsOptional<GetWorkspaceEndpointParams>
  ): Promise<FimidaraEndpointResult<GetWorkspaceEndpointSuccessResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/workspaces/getWorkspace',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  updateWorkspace = async (
    props: FimidaraEndpointParamsRequired<UpdateWorkspaceEndpointParams>
  ): Promise<FimidaraEndpointResult<UpdateWorkspaceEndpointSuccessResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/workspaces/updateWorkspace',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}

export class FimidaraEndpoints extends FimidaraEndpointsBase {
  agentTokens = new AgentTokensEndpoints(this.config, this);
  collaborationRequests = new CollaborationRequestsEndpoints(this.config, this);
  collaborators = new CollaboratorsEndpoints(this.config, this);
  files = new FilesEndpoints(this.config, this);
  folders = new FoldersEndpoints(this.config, this);
  clientLogs = new ClientLogsEndpoints(this.config, this);
  permissionGroups = new PermissionGroupsEndpoints(this.config, this);
  permissionItems = new PermissionItemsEndpoints(this.config, this);
  resources = new ResourcesEndpoints(this.config, this);
  usageRecords = new UsageRecordsEndpoints(this.config, this);
  users = new UsersEndpoints(this.config, this);
  workspaces = new WorkspacesEndpoints(this.config, this);
}
