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
  AddAgentTokenEndpointResult,
  DeleteAgentTokenEndpointParams,
  LongRunningJobResult,
  GetAgentTokenEndpointParams,
  GetAgentTokenEndpointResult,
  GetWorkspaceAgentTokensEndpointParams,
  GetWorkspaceAgentTokensEndpointResult,
  CountWorkspaceAgentTokensEndpointParams,
  CountItemsResult,
  UpdateAgentTokenEndpointParams,
  UpdateAgentTokenEndpointResult,
  DeleteCollaborationRequestEndpointParams,
  GetUserCollaborationRequestEndpointParams,
  GetUserCollaborationRequestEndpointResult,
  GetUserCollaborationRequestsEndpointParams,
  GetUserCollaborationRequestsEndpointResult,
  GetWorkspaceCollaborationRequestEndpointParams,
  GetWorkspaceCollaborationRequestEndpointResult,
  GetWorkspaceCollaborationRequestsEndpointParams,
  GetWorkspaceCollaborationRequestsEndpointResult,
  CountWorkspaceCollaborationRequestsEndpointParams,
  RespondToCollaborationRequestEndpointParams,
  RespondToCollaborationRequestEndpointResult,
  RevokeCollaborationRequestEndpointParams,
  RevokeCollaborationRequestEndpointResult,
  SendCollaborationRequestEndpointParams,
  SendCollaborationRequestEndpointResult,
  UpdateCollaborationRequestEndpointParams,
  UpdateCollaborationRequestEndpointResult,
  GetCollaboratorEndpointParams,
  GetCollaboratorEndpointResult,
  GetWorkspaceCollaboratorsEndpointParams,
  GetWorkspaceCollaboratorsEndpointResult,
  CountWorkspaceCollaboratorsEndpointParams,
  RevokeCollaboratorEndpointParams,
  DeleteFileEndpointParams,
  GetFileDetailsEndpointParams,
  GetFileDetailsEndpointResult,
  ReadFileEndpointParams,
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsEndpointResult,
  IssueFilePresignedPathEndpointParams,
  IssueFilePresignedPathEndpointResult,
  UploadFileEndpointParams,
  UploadFileEndpointResult,
  AddFolderEndpointParams,
  AddFolderEndpointResult,
  DeleteFolderEndpointParams,
  GetFolderEndpointParams,
  GetFolderEndpointResult,
  ListFolderContentEndpointParams,
  ListFolderContentEndpointResult,
  CountFolderContentEndpointParams,
  CountFolderContentEndpointResult,
  UpdateFolderEndpointParams,
  UpdateFolderEndpointResult,
  GetJobStatusEndpointParams,
  GetJobStatusEndpointResult,
  AddPermissionGroupEndpointParams,
  AddPermissionGroupEndpointResult,
  AssignPermissionGroupsEndpointParams,
  DeletePermissionGroupEndpointParams,
  GetPermissionGroupEndpointParams,
  GetPermissionGroupEndpointResult,
  GetEntityAssignedPermissionGroupsParams,
  GetEntityAssignedPermissionGroupsEndpointResult,
  GetWorkspacePermissionGroupsEndpointParams,
  GetWorkspacePermissionGroupsEndpointResult,
  CountWorkspacePermissionGroupsEndpointParams,
  UpdatePermissionGroupEndpointParams,
  UpdatePermissionGroupEndpointResult,
  AddPermissionItemsEndpointParams,
  DeletePermissionItemsEndpointParams,
  ResolveEntityPermissionsEndpointParams,
  ResolveEntityPermissionsEndpointResult,
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
  AddWorkspaceEndpointResult,
  DeleteWorkspaceEndpointParams,
  GetUserWorkspacesEndpointParams,
  GetUserWorkspacesEndpointResult,
  GetWorkspaceEndpointParams,
  GetWorkspaceEndpointResult,
  UpdateWorkspaceEndpointParams,
  UpdateWorkspaceEndpointResult,
} from './publicTypes';
import {Response} from 'cross-fetch';

export class AgentTokensEndpoints extends FimidaraEndpointsBase {
  addToken = async (
    props: FimidaraEndpointParamsRequired<AddAgentTokenEndpointParams>
  ): Promise<FimidaraEndpointResult<AddAgentTokenEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/agentTokens/addToken',
        method: 'POST',
      },
      props
    );
  };
  deleteToken = async (
    props?: FimidaraEndpointParamsOptional<DeleteAgentTokenEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/agentTokens/deleteToken',
        method: 'DELETE',
      },
      props
    );
  };
  getToken = async (
    props?: FimidaraEndpointParamsOptional<GetAgentTokenEndpointParams>
  ): Promise<FimidaraEndpointResult<GetAgentTokenEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/agentTokens/getToken',
        method: 'POST',
      },
      props
    );
  };
  getWorkspaceTokens = async (
    props?: FimidaraEndpointParamsOptional<GetWorkspaceAgentTokensEndpointParams>
  ): Promise<FimidaraEndpointResult<GetWorkspaceAgentTokensEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/agentTokens/getWorkspaceTokens',
        method: 'POST',
      },
      props
    );
  };
  countWorkspaceTokens = async (
    props?: FimidaraEndpointParamsOptional<CountWorkspaceAgentTokensEndpointParams>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/agentTokens/countWorkspaceTokens',
        method: 'POST',
      },
      props
    );
  };
  updateToken = async (
    props: FimidaraEndpointParamsRequired<UpdateAgentTokenEndpointParams>
  ): Promise<FimidaraEndpointResult<UpdateAgentTokenEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/agentTokens/updateToken',
        method: 'POST',
      },
      props
    );
  };
}
export class CollaborationRequestsEndpoints extends FimidaraEndpointsBase {
  deleteRequest = async (
    props: FimidaraEndpointParamsRequired<DeleteCollaborationRequestEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/collaborationRequests/deleteRequest',
        method: 'DELETE',
      },
      props
    );
  };
  getUserRequest = async (
    props: FimidaraEndpointParamsRequired<GetUserCollaborationRequestEndpointParams>
  ): Promise<
    FimidaraEndpointResult<GetUserCollaborationRequestEndpointResult>
  > => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/collaborationRequests/getUserRequest',
        method: 'POST',
      },
      props
    );
  };
  getUserRequests = async (
    props?: FimidaraEndpointParamsOptional<GetUserCollaborationRequestsEndpointParams>
  ): Promise<
    FimidaraEndpointResult<GetUserCollaborationRequestsEndpointResult>
  > => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/collaborationRequests/getUserRequests',
        method: 'POST',
      },
      props
    );
  };
  countUserRequests = async (
    props?: FimidaraEndpointParamsOptional<undefined>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    return this.executeJson(
      {
        path: '/v1/collaborationRequests/countUserRequests',
        method: 'POST',
      },
      props
    );
  };
  getWorkspaceRequest = async (
    props: FimidaraEndpointParamsRequired<GetWorkspaceCollaborationRequestEndpointParams>
  ): Promise<
    FimidaraEndpointResult<GetWorkspaceCollaborationRequestEndpointResult>
  > => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/collaborationRequests/getWorkspaceRequest',
        method: 'POST',
      },
      props
    );
  };
  getWorkspaceRequests = async (
    props?: FimidaraEndpointParamsOptional<GetWorkspaceCollaborationRequestsEndpointParams>
  ): Promise<
    FimidaraEndpointResult<GetWorkspaceCollaborationRequestsEndpointResult>
  > => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/collaborationRequests/getWorkspaceRequests',
        method: 'POST',
      },
      props
    );
  };
  countWorkspaceRequests = async (
    props?: FimidaraEndpointParamsOptional<CountWorkspaceCollaborationRequestsEndpointParams>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/collaborationRequests/countWorkspaceRequests',
        method: 'POST',
      },
      props
    );
  };
  respondToRequest = async (
    props: FimidaraEndpointParamsRequired<RespondToCollaborationRequestEndpointParams>
  ): Promise<
    FimidaraEndpointResult<RespondToCollaborationRequestEndpointResult>
  > => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/collaborationRequests/respondToRequest',
        method: 'POST',
      },
      props
    );
  };
  revokeRequest = async (
    props: FimidaraEndpointParamsRequired<RevokeCollaborationRequestEndpointParams>
  ): Promise<
    FimidaraEndpointResult<RevokeCollaborationRequestEndpointResult>
  > => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/collaborationRequests/revokeRequest',
        method: 'POST',
      },
      props
    );
  };
  sendRequest = async (
    props: FimidaraEndpointParamsRequired<SendCollaborationRequestEndpointParams>
  ): Promise<
    FimidaraEndpointResult<SendCollaborationRequestEndpointResult>
  > => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/collaborationRequests/sendRequest',
        method: 'POST',
      },
      props
    );
  };
  updateRequest = async (
    props: FimidaraEndpointParamsRequired<UpdateCollaborationRequestEndpointParams>
  ): Promise<
    FimidaraEndpointResult<UpdateCollaborationRequestEndpointResult>
  > => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/collaborationRequests/updateRequest',
        method: 'POST',
      },
      props
    );
  };
}
export class CollaboratorsEndpoints extends FimidaraEndpointsBase {
  getCollaborator = async (
    props: FimidaraEndpointParamsRequired<GetCollaboratorEndpointParams>
  ): Promise<FimidaraEndpointResult<GetCollaboratorEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/collaborators/getCollaborator',
        method: 'POST',
      },
      props
    );
  };
  getWorkspaceCollaborators = async (
    props?: FimidaraEndpointParamsOptional<GetWorkspaceCollaboratorsEndpointParams>
  ): Promise<
    FimidaraEndpointResult<GetWorkspaceCollaboratorsEndpointResult>
  > => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/collaborators/getWorkspaceCollaborators',
        method: 'POST',
      },
      props
    );
  };
  countWorkspaceCollaborators = async (
    props?: FimidaraEndpointParamsOptional<CountWorkspaceCollaboratorsEndpointParams>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/collaborators/countWorkspaceCollaborators',
        method: 'POST',
      },
      props
    );
  };
  removeCollaborator = async (
    props: FimidaraEndpointParamsRequired<RevokeCollaboratorEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/collaborators/removeCollaborator',
        method: 'POST',
      },
      props
    );
  };
}
export class FilesEndpoints extends FimidaraEndpointsBase {
  deleteFile = async (
    props?: FimidaraEndpointParamsOptional<DeleteFileEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/files/deleteFile',
        method: 'DELETE',
      },
      props
    );
  };
  getFileDetails = async (
    props?: FimidaraEndpointParamsOptional<GetFileDetailsEndpointParams>
  ): Promise<FimidaraEndpointResult<GetFileDetailsEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/files/getFileDetails',
        method: 'POST',
      },
      props
    );
  };
  readFile = async (
    props?: FimidaraEndpointParamsOptional<ReadFileEndpointParams>
  ): Promise<FimidaraEndpointResult<Response>> => {
    return this.executeRaw(
      {
        data: props?.body,
        path: '/v1/files/readFile',
        method: 'POST',
      },
      props
    );
  };
  updateFileDetails = async (
    props: FimidaraEndpointParamsRequired<UpdateFileDetailsEndpointParams>
  ): Promise<FimidaraEndpointResult<UpdateFileDetailsEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/files/updateFileDetails',
        method: 'POST',
      },
      props
    );
  };
  issueFilePresignedPath = async (
    props?: FimidaraEndpointParamsOptional<IssueFilePresignedPathEndpointParams>
  ): Promise<FimidaraEndpointResult<IssueFilePresignedPathEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/files/issueFilePresignedPath',
        method: 'POST',
      },
      props
    );
  };
  uploadFile = async (
    props: FimidaraEndpointParamsRequired<UploadFileEndpointParams>
  ): Promise<FimidaraEndpointResult<UploadFileEndpointResult>> => {
    return this.executeJson(
      {
        formdata: props.body,
        path: '/v1/files/uploadFile',
        method: 'POST',
      },
      props
    );
  };
}
export class FoldersEndpoints extends FimidaraEndpointsBase {
  addFolder = async (
    props: FimidaraEndpointParamsRequired<AddFolderEndpointParams>
  ): Promise<FimidaraEndpointResult<AddFolderEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/folders/addFolder',
        method: 'POST',
      },
      props
    );
  };
  deleteFolder = async (
    props?: FimidaraEndpointParamsOptional<DeleteFolderEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/folders/deleteFolder',
        method: 'DELETE',
      },
      props
    );
  };
  getFolder = async (
    props?: FimidaraEndpointParamsOptional<GetFolderEndpointParams>
  ): Promise<FimidaraEndpointResult<GetFolderEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/folders/getFolder',
        method: 'POST',
      },
      props
    );
  };
  listFolderContent = async (
    props?: FimidaraEndpointParamsOptional<ListFolderContentEndpointParams>
  ): Promise<FimidaraEndpointResult<ListFolderContentEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/folders/listFolderContent',
        method: 'POST',
      },
      props
    );
  };
  countFolderContent = async (
    props?: FimidaraEndpointParamsOptional<CountFolderContentEndpointParams>
  ): Promise<FimidaraEndpointResult<CountFolderContentEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/folders/countFolderContent',
        method: 'POST',
      },
      props
    );
  };
  updateFolder = async (
    props: FimidaraEndpointParamsRequired<UpdateFolderEndpointParams>
  ): Promise<FimidaraEndpointResult<UpdateFolderEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/folders/updateFolder',
        method: 'POST',
      },
      props
    );
  };
}
export class JobsEndpoints extends FimidaraEndpointsBase {
  getJobStatus = async (
    props: FimidaraEndpointParamsRequired<GetJobStatusEndpointParams>
  ): Promise<FimidaraEndpointResult<GetJobStatusEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/jobs/getJobStatus',
        method: 'POST',
      },
      props
    );
  };
}
export class PermissionGroupsEndpoints extends FimidaraEndpointsBase {
  addPermissionGroup = async (
    props: FimidaraEndpointParamsRequired<AddPermissionGroupEndpointParams>
  ): Promise<FimidaraEndpointResult<AddPermissionGroupEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/permissionGroups/addPermissionGroup',
        method: 'POST',
      },
      props
    );
  };
  assignPermissionGroups = async (
    props: FimidaraEndpointParamsRequired<AssignPermissionGroupsEndpointParams>
  ): Promise<FimidaraEndpointResult<undefined>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/permissionGroups/assignPermissionGroups',
        method: 'POST',
      },
      props
    );
  };
  deletePermissionGroup = async (
    props?: FimidaraEndpointParamsOptional<DeletePermissionGroupEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/permissionGroups/deletePermissionGroup',
        method: 'DELETE',
      },
      props
    );
  };
  getPermissionGroup = async (
    props?: FimidaraEndpointParamsOptional<GetPermissionGroupEndpointParams>
  ): Promise<FimidaraEndpointResult<GetPermissionGroupEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/permissionGroups/getPermissionGroup',
        method: 'POST',
      },
      props
    );
  };
  getEntityAssignedPermissionGroups = async (
    props: FimidaraEndpointParamsRequired<GetEntityAssignedPermissionGroupsParams>
  ): Promise<
    FimidaraEndpointResult<GetEntityAssignedPermissionGroupsEndpointResult>
  > => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/permissionGroups/getEntityAssignedPermissionGroups',
        method: 'POST',
      },
      props
    );
  };
  getWorkspacePermissionGroups = async (
    props?: FimidaraEndpointParamsOptional<GetWorkspacePermissionGroupsEndpointParams>
  ): Promise<
    FimidaraEndpointResult<GetWorkspacePermissionGroupsEndpointResult>
  > => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/permissionGroups/getWorkspacePermissionGroups',
        method: 'POST',
      },
      props
    );
  };
  countWorkspacePermissionGroups = async (
    props?: FimidaraEndpointParamsOptional<CountWorkspacePermissionGroupsEndpointParams>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/permissionGroups/countWorkspacePermissionGroups',
        method: 'POST',
      },
      props
    );
  };
  updatePermissionGroup = async (
    props: FimidaraEndpointParamsRequired<UpdatePermissionGroupEndpointParams>
  ): Promise<FimidaraEndpointResult<UpdatePermissionGroupEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/permissionGroups/updatePermissionGroup',
        method: 'POST',
      },
      props
    );
  };
}
export class PermissionItemsEndpoints extends FimidaraEndpointsBase {
  addItems = async (
    props: FimidaraEndpointParamsRequired<AddPermissionItemsEndpointParams>
  ): Promise<FimidaraEndpointResult<undefined>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/permissionItems/addItems',
        method: 'POST',
      },
      props
    );
  };
  deleteItems = async (
    props?: FimidaraEndpointParamsOptional<DeletePermissionItemsEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/permissionItems/deleteItems',
        method: 'DELETE',
      },
      props
    );
  };
  resolveEntityPermissions = async (
    props: FimidaraEndpointParamsRequired<ResolveEntityPermissionsEndpointParams>
  ): Promise<
    FimidaraEndpointResult<ResolveEntityPermissionsEndpointResult>
  > => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/permissionItems/resolveEntityPermissions',
        method: 'POST',
      },
      props
    );
  };
}
export class ResourcesEndpoints extends FimidaraEndpointsBase {
  getResources = async (
    props: FimidaraEndpointParamsRequired<ResourceWrapper>
  ): Promise<FimidaraEndpointResult<GetResourcesEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/resources/getResources',
        method: 'POST',
      },
      props
    );
  };
}
export class UsageRecordsEndpoints extends FimidaraEndpointsBase {
  getUsageCosts = async (
    props?: FimidaraEndpointParamsOptional<undefined>
  ): Promise<FimidaraEndpointResult<GetUsageCostsEndpointResult>> => {
    return this.executeJson(
      {
        path: '/v1/usageRecords/getUsageCosts',
        method: 'POST',
      },
      props
    );
  };
  getWorkspaceSummedUsage = async (
    props?: FimidaraEndpointParamsOptional<GetWorkspaceSummedUsageEndpointParams>
  ): Promise<FimidaraEndpointResult<GetWorkspaceSummedUsageEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/usageRecords/getWorkspaceSummedUsage',
        method: 'POST',
      },
      props
    );
  };
  countWorkspaceSummedUsage = async (
    props?: FimidaraEndpointParamsOptional<CountWorkspaceSummedUsageEndpointParams>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/usageRecords/countWorkspaceSummedUsage',
        method: 'POST',
      },
      props
    );
  };
}
export class UsersEndpoints extends FimidaraEndpointsBase {
  getUserData = async (
    props?: FimidaraEndpointParamsOptional<undefined>
  ): Promise<FimidaraEndpointResult<LoginResult>> => {
    return this.executeJson(
      {
        path: '/v1/users/getUserData',
        method: 'POST',
      },
      props
    );
  };
  updateUser = async (
    props?: FimidaraEndpointParamsOptional<UpdateUserEndpointParams>
  ): Promise<FimidaraEndpointResult<UpdateUserEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/users/updateUser',
        method: 'POST',
      },
      props
    );
  };
}
export class WorkspacesEndpoints extends FimidaraEndpointsBase {
  addWorkspace = async (
    props: FimidaraEndpointParamsRequired<AddWorkspaceEndpointParams>
  ): Promise<FimidaraEndpointResult<AddWorkspaceEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/workspaces/addWorkspace',
        method: 'POST',
      },
      props
    );
  };
  deleteWorkspace = async (
    props?: FimidaraEndpointParamsOptional<DeleteWorkspaceEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/workspaces/deleteWorkspace',
        method: 'DELETE',
      },
      props
    );
  };
  getUserWorkspaces = async (
    props?: FimidaraEndpointParamsOptional<GetUserWorkspacesEndpointParams>
  ): Promise<FimidaraEndpointResult<GetUserWorkspacesEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/workspaces/getUserWorkspaces',
        method: 'POST',
      },
      props
    );
  };
  countUserWorkspaces = async (
    props?: FimidaraEndpointParamsOptional<undefined>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    return this.executeJson(
      {
        path: '/v1/workspaces/countUserWorkspaces',
        method: 'POST',
      },
      props
    );
  };
  getWorkspace = async (
    props?: FimidaraEndpointParamsOptional<GetWorkspaceEndpointParams>
  ): Promise<FimidaraEndpointResult<GetWorkspaceEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/workspaces/getWorkspace',
        method: 'POST',
      },
      props
    );
  };
  updateWorkspace = async (
    props: FimidaraEndpointParamsRequired<UpdateWorkspaceEndpointParams>
  ): Promise<FimidaraEndpointResult<UpdateWorkspaceEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/workspaces/updateWorkspace',
        method: 'POST',
      },
      props
    );
  };
}
export class FimidaraEndpoints extends FimidaraEndpointsBase {
  agentTokens = new AgentTokensEndpoints(this.config, this);
  collaborationRequests = new CollaborationRequestsEndpoints(this.config, this);
  collaborators = new CollaboratorsEndpoints(this.config, this);
  files = new FilesEndpoints(this.config, this);
  folders = new FoldersEndpoints(this.config, this);
  jobs = new JobsEndpoints(this.config, this);
  permissionGroups = new PermissionGroupsEndpoints(this.config, this);
  permissionItems = new PermissionItemsEndpoints(this.config, this);
  resources = new ResourcesEndpoints(this.config, this);
  usageRecords = new UsageRecordsEndpoints(this.config, this);
  users = new UsersEndpoints(this.config, this);
  workspaces = new WorkspacesEndpoints(this.config, this);
}
