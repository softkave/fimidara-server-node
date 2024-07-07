// This file is auto-generated, do not modify directly.
// Reach out to @abayomi to suggest changes.

import {
  AddAgentTokenEndpointParams,
  AddAgentTokenEndpointResult,
  AddFileBackendConfigEndpointParams,
  AddFileBackendConfigEndpointResult,
  AddFileBackendMountEndpointParams,
  AddFileBackendMountEndpointResult,
  AddFolderEndpointParams,
  AddFolderEndpointResult,
  AddPermissionGroupEndpointParams,
  AddPermissionGroupEndpointResult,
  AddPermissionItemsEndpointParams,
  AddWorkspaceEndpointParams,
  AddWorkspaceEndpointResult,
  AssignPermissionGroupsEndpointParams,
  CountFileBackendConfigsEndpointParams,
  CountFileBackendMountsEndpointParams,
  CountFolderContentEndpointParams,
  CountFolderContentEndpointResult,
  CountItemsResult,
  CountWorkspaceAgentTokensEndpointParams,
  CountWorkspaceCollaborationRequestsEndpointParams,
  CountWorkspaceCollaboratorsEndpointParams,
  CountWorkspacePermissionGroupsEndpointParams,
  CountWorkspaceSummedUsageEndpointParams,
  DeleteAgentTokenEndpointParams,
  DeleteCollaborationRequestEndpointParams,
  DeleteFileBackendConfigEndpointParams,
  DeleteFileBackendMountEndpointParams,
  DeleteFileEndpointParams,
  DeleteFolderEndpointParams,
  DeleteFolderEndpointResult,
  DeletePermissionGroupEndpointParams,
  DeletePermissionItemsEndpointParams,
  GetAgentTokenEndpointParams,
  GetAgentTokenEndpointResult,
  GetCollaboratorEndpointParams,
  GetCollaboratorEndpointResult,
  GetEntityAssignedPermissionGroupsEndpointResult,
  GetEntityAssignedPermissionGroupsParams,
  GetFileBackendConfigEndpointParams,
  GetFileBackendConfigEndpointResult,
  GetFileBackendConfigsEndpointParams,
  GetFileBackendConfigsEndpointResult,
  GetFileBackendMountEndpointParams,
  GetFileBackendMountEndpointResult,
  GetFileBackendMountsEndpointParams,
  GetFileBackendMountsEndpointResult,
  GetFileDetailsEndpointParams,
  GetFileDetailsEndpointResult,
  GetFolderEndpointParams,
  GetFolderEndpointResult,
  GetJobStatusEndpointParams,
  GetJobStatusEndpointResult,
  GetPermissionGroupEndpointParams,
  GetPermissionGroupEndpointResult,
  GetPresignedPathsForFilesEndpointParams,
  GetPresignedPathsForFilesEndpointResult,
  GetResourcesEndpointParams,
  GetResourcesEndpointResult,
  GetUsageCostsEndpointResult,
  GetUserCollaborationRequestEndpointParams,
  GetUserCollaborationRequestEndpointResult,
  GetUserCollaborationRequestsEndpointParams,
  GetUserCollaborationRequestsEndpointResult,
  GetUserWorkspacesEndpointParams,
  GetUserWorkspacesEndpointResult,
  GetWorkspaceAgentTokensEndpointParams,
  GetWorkspaceAgentTokensEndpointResult,
  GetWorkspaceCollaborationRequestEndpointParams,
  GetWorkspaceCollaborationRequestEndpointResult,
  GetWorkspaceCollaborationRequestsEndpointParams,
  GetWorkspaceCollaborationRequestsEndpointResult,
  GetWorkspaceCollaboratorsEndpointParams,
  GetWorkspaceCollaboratorsEndpointResult,
  GetWorkspaceEndpointParams,
  GetWorkspaceEndpointResult,
  GetWorkspacePermissionGroupsEndpointParams,
  GetWorkspacePermissionGroupsEndpointResult,
  GetWorkspaceSummedUsageEndpointParams,
  GetWorkspaceSummedUsageEndpointResult,
  IssuePresignedPathEndpointParams,
  IssuePresignedPathEndpointResult,
  ListFolderContentEndpointParams,
  ListFolderContentEndpointResult,
  LoginResult,
  LongRunningJobResult,
  MultipleLongRunningJobResult,
  ReadFileEndpointParams,
  ResolveEntityPermissionsEndpointParams,
  ResolveEntityPermissionsEndpointResult,
  ResolveFileBackendMountsEndpointParams,
  ResolveFileBackendMountsEndpointResult,
  RespondToCollaborationRequestEndpointParams,
  RespondToCollaborationRequestEndpointResult,
  RevokeCollaborationRequestEndpointParams,
  RevokeCollaborationRequestEndpointResult,
  RevokeCollaboratorEndpointParams,
  SendCollaborationRequestEndpointParams,
  SendCollaborationRequestEndpointResult,
  UnassignPermissionGroupsEndpointParams,
  UpdateAgentTokenEndpointParams,
  UpdateAgentTokenEndpointResult,
  UpdateCollaborationRequestEndpointParams,
  UpdateCollaborationRequestEndpointResult,
  UpdateFileBackendConfigEndpointParams,
  UpdateFileBackendConfigEndpointResult,
  UpdateFileBackendMountEndpointParams,
  UpdateFileBackendMountEndpointResult,
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsEndpointResult,
  UpdateFolderEndpointParams,
  UpdateFolderEndpointResult,
  UpdatePermissionGroupEndpointParams,
  UpdatePermissionGroupEndpointResult,
  UpdateUserEndpointParams,
  UpdateUserEndpointResult,
  UpdateWorkspaceEndpointParams,
  UpdateWorkspaceEndpointResult,
  UploadFileEndpointParams,
  UploadFileEndpointResult,
} from './publicTypes.js';
import {
  FimidaraEndpointParamsOptional,
  FimidaraEndpointParamsRequired,
  FimidaraEndpointResult,
  FimidaraEndpointsBase,
  FimidaraEndpointWithBinaryResponseParamsOptional,
} from './utils.js';

import type {Readable} from 'stream';

export class AgentTokensEndpoints extends FimidaraEndpointsBase {
  addToken = async (
    props: FimidaraEndpointParamsRequired<AddAgentTokenEndpointParams>
  ): Promise<FimidaraEndpointResult<AddAgentTokenEndpointResult>> => {
    return this.executeJson(
      {
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,

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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
        data: props?.body,
        path: '/v1/files/getFileDetails',
        method: 'POST',
      },
      props
    );
  };
  readFile = async (
    props: FimidaraEndpointWithBinaryResponseParamsOptional<ReadFileEndpointParams>
  ): Promise<FimidaraEndpointResult<Blob | Readable>> => {
    const mapping = {
      filepath: ['path', 'filepathOrId'],
      fileId: ['path', 'filepathOrId'],
    } as const;
    return this.executeRaw(
      {
        ...props,
        responseType: props.responseType,
        data: props?.body,
        path: '/v1/files/readFile/:filepathOrId',
        method: 'POST',
      },
      props,
      mapping
    );
  };
  updateFileDetails = async (
    props: FimidaraEndpointParamsRequired<UpdateFileDetailsEndpointParams>
  ): Promise<FimidaraEndpointResult<UpdateFileDetailsEndpointResult>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/files/updateFileDetails',
        method: 'POST',
      },
      props
    );
  };
  uploadFile = async (
    props: FimidaraEndpointParamsRequired<UploadFileEndpointParams>
  ): Promise<FimidaraEndpointResult<UploadFileEndpointResult>> => {
    const mapping = {
      filepath: ['path', 'filepathOrId'],
      fileId: ['path', 'filepathOrId'],
      data: ['body', 'data'],
      description: ['header', 'x-fimidara-file-description'],
      size: ['header', 'x-fimidara-file-size'],
      encoding: ['header', 'x-fimidara-file-encoding'],
      mimetype: ['header', 'x-fimidara-file-mimetype'],
    } as const;
    return this.executeJson(
      {
        ...props,
        formdata: props.body,
        path: '/v1/files/uploadFile/:filepathOrId',
        method: 'POST',
      },
      props,
      mapping
    );
  };
}
export class FoldersEndpoints extends FimidaraEndpointsBase {
  addFolder = async (
    props: FimidaraEndpointParamsRequired<AddFolderEndpointParams>
  ): Promise<FimidaraEndpointResult<AddFolderEndpointResult>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/folders/addFolder',
        method: 'POST',
      },
      props
    );
  };
  deleteFolder = async (
    props?: FimidaraEndpointParamsOptional<DeleteFolderEndpointParams>
  ): Promise<FimidaraEndpointResult<DeleteFolderEndpointResult>> => {
    return this.executeJson(
      {
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
        data: props?.body,
        path: '/v1/permissionGroups/assignPermissionGroups',
        method: 'POST',
      },
      props
    );
  };
  unassignPermissionGroups = async (
    props: FimidaraEndpointParamsRequired<UnassignPermissionGroupsEndpointParams>
  ): Promise<FimidaraEndpointResult<undefined>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/permissionGroups/unassignPermissionGroups',
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
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
        ...props,
        data: props?.body,
        path: '/v1/permissionItems/addItems',
        method: 'POST',
      },
      props
    );
  };
  deleteItems = async (
    props: FimidaraEndpointParamsRequired<DeletePermissionItemsEndpointParams>
  ): Promise<FimidaraEndpointResult<MultipleLongRunningJobResult>> => {
    return this.executeJson(
      {
        ...props,
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
        ...props,
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
    props: FimidaraEndpointParamsRequired<GetResourcesEndpointParams>
  ): Promise<FimidaraEndpointResult<GetResourcesEndpointResult>> => {
    return this.executeJson(
      {
        ...props,
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
        ...props,

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
        ...props,
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
        ...props,
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
        ...props,

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
        ...props,
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
        ...props,
        data: props?.body,
        path: '/v1/workspaces/addWorkspace',
        method: 'POST',
      },
      props
    );
  };
  getUserWorkspaces = async (
    props?: FimidaraEndpointParamsOptional<GetUserWorkspacesEndpointParams>
  ): Promise<FimidaraEndpointResult<GetUserWorkspacesEndpointResult>> => {
    return this.executeJson(
      {
        ...props,
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
        ...props,

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
        ...props,
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
        ...props,
        data: props?.body,
        path: '/v1/workspaces/updateWorkspace',
        method: 'POST',
      },
      props
    );
  };
}
export class FileBackendsEndpoints extends FimidaraEndpointsBase {
  addMount = async (
    props: FimidaraEndpointParamsRequired<AddFileBackendMountEndpointParams>
  ): Promise<FimidaraEndpointResult<AddFileBackendMountEndpointResult>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/fileBackends/addMount',
        method: 'POST',
      },
      props
    );
  };
  deleteMount = async (
    props: FimidaraEndpointParamsRequired<DeleteFileBackendMountEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/fileBackends/deleteMount',
        method: 'DELETE',
      },
      props
    );
  };
  getMount = async (
    props: FimidaraEndpointParamsRequired<GetFileBackendMountEndpointParams>
  ): Promise<FimidaraEndpointResult<GetFileBackendMountEndpointResult>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/fileBackends/getMount',
        method: 'POST',
      },
      props
    );
  };
  getMounts = async (
    props?: FimidaraEndpointParamsOptional<GetFileBackendMountsEndpointParams>
  ): Promise<FimidaraEndpointResult<GetFileBackendMountsEndpointResult>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/fileBackends/getMounts',
        method: 'POST',
      },
      props
    );
  };
  countMounts = async (
    props?: FimidaraEndpointParamsOptional<CountFileBackendMountsEndpointParams>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/fileBackends/countMounts',
        method: 'POST',
      },
      props
    );
  };
  updateMount = async (
    props: FimidaraEndpointParamsRequired<UpdateFileBackendMountEndpointParams>
  ): Promise<FimidaraEndpointResult<UpdateFileBackendMountEndpointResult>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/fileBackends/updateMount',
        method: 'POST',
      },
      props
    );
  };
  resolveMounts = async (
    props?: FimidaraEndpointParamsOptional<ResolveFileBackendMountsEndpointParams>
  ): Promise<
    FimidaraEndpointResult<ResolveFileBackendMountsEndpointResult>
  > => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/fileBackends/resolveMounts',
        method: 'POST',
      },
      props
    );
  };
  addConfig = async (
    props: FimidaraEndpointParamsRequired<AddFileBackendConfigEndpointParams>
  ): Promise<FimidaraEndpointResult<AddFileBackendConfigEndpointResult>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/fileBackends/addConfig',
        method: 'POST',
      },
      props
    );
  };
  deleteConfig = async (
    props: FimidaraEndpointParamsRequired<DeleteFileBackendConfigEndpointParams>
  ): Promise<FimidaraEndpointResult<LongRunningJobResult>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/fileBackends/deleteConfig',
        method: 'DELETE',
      },
      props
    );
  };
  getConfig = async (
    props: FimidaraEndpointParamsRequired<GetFileBackendConfigEndpointParams>
  ): Promise<FimidaraEndpointResult<GetFileBackendConfigEndpointResult>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/fileBackends/getConfig',
        method: 'POST',
      },
      props
    );
  };
  getConfigs = async (
    props?: FimidaraEndpointParamsOptional<GetFileBackendConfigsEndpointParams>
  ): Promise<FimidaraEndpointResult<GetFileBackendConfigsEndpointResult>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/fileBackends/getConfigs',
        method: 'POST',
      },
      props
    );
  };
  countConfigs = async (
    props?: FimidaraEndpointParamsOptional<CountFileBackendConfigsEndpointParams>
  ): Promise<FimidaraEndpointResult<CountItemsResult>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/fileBackends/countConfigs',
        method: 'POST',
      },
      props
    );
  };
  updateConfig = async (
    props: FimidaraEndpointParamsRequired<UpdateFileBackendConfigEndpointParams>
  ): Promise<FimidaraEndpointResult<UpdateFileBackendConfigEndpointResult>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/fileBackends/updateConfig',
        method: 'POST',
      },
      props
    );
  };
}
export class PresignedPathsEndpoints extends FimidaraEndpointsBase {
  issuePresignedPath = async (
    props?: FimidaraEndpointParamsOptional<IssuePresignedPathEndpointParams>
  ): Promise<FimidaraEndpointResult<IssuePresignedPathEndpointResult>> => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/presignedPaths/issuePresignedPath',
        method: 'POST',
      },
      props
    );
  };
  getPresignedPaths = async (
    props?: FimidaraEndpointParamsOptional<GetPresignedPathsForFilesEndpointParams>
  ): Promise<
    FimidaraEndpointResult<GetPresignedPathsForFilesEndpointResult>
  > => {
    return this.executeJson(
      {
        ...props,
        data: props?.body,
        path: '/v1/presignedPaths/getPresignedPaths',
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
  fileBackends = new FileBackendsEndpoints(this.config, this);
  presignedPaths = new PresignedPathsEndpoints(this.config, this);
}
