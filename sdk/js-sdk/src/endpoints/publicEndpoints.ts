// This file is auto-generated, do not modify directly.
// Reach out to @abayomi to suggest changes.

import {
  FimidaraEndpointsBase,
  FimidaraEndpointResultWithBinaryResponse,
  FimidaraEndpointOpts,
  FimidaraEndpointDownloadBinaryOpts,
  FimidaraEndpointUploadBinaryOpts,
} from './endpointImports.js';
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
  RefreshAgentTokenEndpointParams,
  RefreshAgentTokenEndpointResult,
  EncodeAgentTokenEndpointParams,
  EncodeAgentTokenEndpointResult,
  DeleteCollaborationRequestEndpointParams,
  GetWorkspaceCollaborationRequestEndpointParams,
  GetWorkspaceCollaborationRequestEndpointResult,
  GetWorkspaceCollaborationRequestsEndpointParams,
  GetWorkspaceCollaborationRequestsEndpointResult,
  CountWorkspaceCollaborationRequestsEndpointParams,
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
  ListPartsEndpointParams,
  ListPartsEndpointResult,
  ReadFileEndpointParams,
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsEndpointResult,
  UploadFileEndpointParams,
  UploadFileEndpointResult,
  StartMultipartUploadEndpointParams,
  StartMultipartUploadEndpointResult,
  CompleteMultipartUploadEndpointParams,
  CompleteMultipartUploadEndpointResult,
  AddFolderEndpointParams,
  AddFolderEndpointResult,
  DeleteFolderEndpointParams,
  DeleteFolderEndpointResult,
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
  UnassignPermissionGroupsEndpointParams,
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
  MultipleLongRunningJobResult,
  ResolveEntityPermissionsEndpointParams,
  ResolveEntityPermissionsEndpointResult,
  GetResourcesEndpointParams,
  GetResourcesEndpointResult,
  GetUsageCostsEndpointResult,
  GetWorkspaceSummedUsageEndpointParams,
  GetWorkspaceSummedUsageEndpointResult,
  CountWorkspaceSummedUsageEndpointParams,
  GetWorkspaceEndpointParams,
  GetWorkspaceEndpointResult,
  UpdateWorkspaceEndpointParams,
  UpdateWorkspaceEndpointResult,
  AddFileBackendMountEndpointParams,
  AddFileBackendMountEndpointResult,
  DeleteFileBackendMountEndpointParams,
  GetFileBackendMountEndpointParams,
  GetFileBackendMountEndpointResult,
  GetFileBackendMountsEndpointParams,
  GetFileBackendMountsEndpointResult,
  CountFileBackendMountsEndpointParams,
  UpdateFileBackendMountEndpointParams,
  UpdateFileBackendMountEndpointResult,
  ResolveFileBackendMountsEndpointParams,
  ResolveFileBackendMountsEndpointResult,
  AddFileBackendConfigEndpointParams,
  AddFileBackendConfigEndpointResult,
  DeleteFileBackendConfigEndpointParams,
  GetFileBackendConfigEndpointParams,
  GetFileBackendConfigEndpointResult,
  GetFileBackendConfigsEndpointParams,
  GetFileBackendConfigsEndpointResult,
  CountFileBackendConfigsEndpointParams,
  UpdateFileBackendConfigEndpointParams,
  UpdateFileBackendConfigEndpointResult,
  IssuePresignedPathEndpointParams,
  IssuePresignedPathEndpointResult,
  GetPresignedPathsForFilesEndpointParams,
  GetPresignedPathsForFilesEndpointResult,
} from './publicTypes.js';

export class AgentTokensEndpoints extends FimidaraEndpointsBase {
  addToken = async (
    props?: AddAgentTokenEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<AddAgentTokenEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/agentTokens/addToken',
        method: 'POST',
      },
      opts
    );
  };
  deleteToken = async (
    props?: DeleteAgentTokenEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<LongRunningJobResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/agentTokens/deleteToken',
        method: 'DELETE',
      },
      opts
    );
  };
  getToken = async (
    props?: GetAgentTokenEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetAgentTokenEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/agentTokens/getToken',
        method: 'POST',
      },
      opts
    );
  };
  getWorkspaceTokens = async (
    props?: GetWorkspaceAgentTokensEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetWorkspaceAgentTokensEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/agentTokens/getWorkspaceTokens',
        method: 'POST',
      },
      opts
    );
  };
  countWorkspaceTokens = async (
    props?: CountWorkspaceAgentTokensEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<CountItemsResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/agentTokens/countWorkspaceTokens',
        method: 'POST',
      },
      opts
    );
  };
  updateToken = async (
    props: UpdateAgentTokenEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<UpdateAgentTokenEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/agentTokens/updateToken',
        method: 'POST',
      },
      opts
    );
  };
  refreshToken = async (
    props: RefreshAgentTokenEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<RefreshAgentTokenEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/agentTokens/refreshToken',
        method: 'POST',
      },
      opts
    );
  };
  encodeToken = async (
    props?: EncodeAgentTokenEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<EncodeAgentTokenEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/agentTokens/encodeToken',
        method: 'POST',
      },
      opts
    );
  };
}
export class CollaborationRequestsEndpoints extends FimidaraEndpointsBase {
  deleteRequest = async (
    props: DeleteCollaborationRequestEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<LongRunningJobResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/collaborationRequests/deleteRequest',
        method: 'DELETE',
      },
      opts
    );
  };
  getWorkspaceRequest = async (
    props: GetWorkspaceCollaborationRequestEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetWorkspaceCollaborationRequestEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/collaborationRequests/getWorkspaceRequest',
        method: 'POST',
      },
      opts
    );
  };
  getWorkspaceRequests = async (
    props?: GetWorkspaceCollaborationRequestsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetWorkspaceCollaborationRequestsEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/collaborationRequests/getWorkspaceRequests',
        method: 'POST',
      },
      opts
    );
  };
  countWorkspaceRequests = async (
    props?: CountWorkspaceCollaborationRequestsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<CountItemsResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/collaborationRequests/countWorkspaceRequests',
        method: 'POST',
      },
      opts
    );
  };
  revokeRequest = async (
    props: RevokeCollaborationRequestEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<RevokeCollaborationRequestEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/collaborationRequests/revokeRequest',
        method: 'POST',
      },
      opts
    );
  };
  sendRequest = async (
    props: SendCollaborationRequestEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<SendCollaborationRequestEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/collaborationRequests/sendRequest',
        method: 'POST',
      },
      opts
    );
  };
  updateRequest = async (
    props: UpdateCollaborationRequestEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<UpdateCollaborationRequestEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/collaborationRequests/updateRequest',
        method: 'POST',
      },
      opts
    );
  };
}
export class CollaboratorsEndpoints extends FimidaraEndpointsBase {
  getCollaborator = async (
    props: GetCollaboratorEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetCollaboratorEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/collaborators/getCollaborator',
        method: 'POST',
      },
      opts
    );
  };
  getWorkspaceCollaborators = async (
    props?: GetWorkspaceCollaboratorsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetWorkspaceCollaboratorsEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/collaborators/getWorkspaceCollaborators',
        method: 'POST',
      },
      opts
    );
  };
  countWorkspaceCollaborators = async (
    props?: CountWorkspaceCollaboratorsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<CountItemsResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/collaborators/countWorkspaceCollaborators',
        method: 'POST',
      },
      opts
    );
  };
  removeCollaborator = async (
    props: RevokeCollaboratorEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<LongRunningJobResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/collaborators/removeCollaborator',
        method: 'POST',
      },
      opts
    );
  };
}
export class FilesEndpoints extends FimidaraEndpointsBase {
  deleteFile = async (
    props?: DeleteFileEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<LongRunningJobResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/files/deleteFile',
        method: 'DELETE',
      },
      opts
    );
  };
  getFileDetails = async (
    props?: GetFileDetailsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetFileDetailsEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/files/getFileDetails',
        method: 'POST',
      },
      opts
    );
  };
  listParts = async (
    props?: ListPartsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<ListPartsEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/files/listParts',
        method: 'POST',
      },
      opts
    );
  };
  readFile = async <TResponseType extends 'blob' | 'stream'>(
    props?: ReadFileEndpointParams,
    opts: FimidaraEndpointDownloadBinaryOpts<TResponseType> = {
      responseType: 'blob',
    } as FimidaraEndpointDownloadBinaryOpts<TResponseType>
  ): Promise<FimidaraEndpointResultWithBinaryResponse<TResponseType>> => {
    const mapping = {
      filepath: ['path', 'filepathOrId'],
      fileId: ['path', 'filepathOrId'],
    } as const;
    return this.executeRaw(
      {
        responseType: opts.responseType,
        data: props,
        path: '/v1/files/readFile/:filepathOrId',
        method: 'POST',
      },
      opts,
      mapping
    );
  };
  updateFileDetails = async (
    props: UpdateFileDetailsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<UpdateFileDetailsEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/files/updateFileDetails',
        method: 'POST',
      },
      opts
    );
  };
  uploadFile = async (
    props: UploadFileEndpointParams,
    opts?: FimidaraEndpointUploadBinaryOpts
  ): Promise<UploadFileEndpointResult> => {
    const mapping = {
      filepath: ['path', 'filepathOrId'],
      fileId: ['path', 'filepathOrId'],
      data: ['body', 'data'],
      description: ['header', 'x-fimidara-file-description'],
      size: ['header', 'x-fimidara-file-size'],
      encoding: ['header', 'x-fimidara-file-encoding'],
      mimetype: ['header', 'x-fimidara-file-mimetype'],
      clientMultipartId: ['header', 'x-fimidara-multipart-id'],
      part: ['header', 'x-fimidara-multipart-part'],
    } as const;
    return this.executeJson(
      {
        formdata: props,
        path: '/v1/files/uploadFile/:filepathOrId',
        method: 'POST',
      },
      opts,
      mapping
    );
  };
  startMultipartUpload = async (
    props: StartMultipartUploadEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<StartMultipartUploadEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/files/startMultipartUpload',
        method: 'POST',
      },
      opts
    );
  };
  completeMultipartUpload = async (
    props: CompleteMultipartUploadEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<CompleteMultipartUploadEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/files/completeMultipartUpload',
        method: 'POST',
      },
      opts
    );
  };
}
export class FoldersEndpoints extends FimidaraEndpointsBase {
  addFolder = async (
    props: AddFolderEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<AddFolderEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/folders/addFolder',
        method: 'POST',
      },
      opts
    );
  };
  deleteFolder = async (
    props?: DeleteFolderEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<DeleteFolderEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/folders/deleteFolder',
        method: 'DELETE',
      },
      opts
    );
  };
  getFolder = async (
    props?: GetFolderEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetFolderEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/folders/getFolder',
        method: 'POST',
      },
      opts
    );
  };
  listFolderContent = async (
    props?: ListFolderContentEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<ListFolderContentEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/folders/listFolderContent',
        method: 'POST',
      },
      opts
    );
  };
  countFolderContent = async (
    props?: CountFolderContentEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<CountFolderContentEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/folders/countFolderContent',
        method: 'POST',
      },
      opts
    );
  };
  updateFolder = async (
    props: UpdateFolderEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<UpdateFolderEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/folders/updateFolder',
        method: 'POST',
      },
      opts
    );
  };
}
export class JobsEndpoints extends FimidaraEndpointsBase {
  getJobStatus = async (
    props: GetJobStatusEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetJobStatusEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/jobs/getJobStatus',
        method: 'POST',
      },
      opts
    );
  };
}
export class PermissionGroupsEndpoints extends FimidaraEndpointsBase {
  addPermissionGroup = async (
    props: AddPermissionGroupEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<AddPermissionGroupEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/permissionGroups/addPermissionGroup',
        method: 'POST',
      },
      opts
    );
  };
  assignPermissionGroups = async (
    props: AssignPermissionGroupsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<void> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/permissionGroups/assignPermissionGroups',
        method: 'POST',
      },
      opts
    );
  };
  unassignPermissionGroups = async (
    props: UnassignPermissionGroupsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<void> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/permissionGroups/unassignPermissionGroups',
        method: 'POST',
      },
      opts
    );
  };
  deletePermissionGroup = async (
    props?: DeletePermissionGroupEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<LongRunningJobResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/permissionGroups/deletePermissionGroup',
        method: 'DELETE',
      },
      opts
    );
  };
  getPermissionGroup = async (
    props?: GetPermissionGroupEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetPermissionGroupEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/permissionGroups/getPermissionGroup',
        method: 'POST',
      },
      opts
    );
  };
  getEntityAssignedPermissionGroups = async (
    props: GetEntityAssignedPermissionGroupsParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetEntityAssignedPermissionGroupsEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/permissionGroups/getEntityAssignedPermissionGroups',
        method: 'POST',
      },
      opts
    );
  };
  getWorkspacePermissionGroups = async (
    props?: GetWorkspacePermissionGroupsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetWorkspacePermissionGroupsEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/permissionGroups/getWorkspacePermissionGroups',
        method: 'POST',
      },
      opts
    );
  };
  countWorkspacePermissionGroups = async (
    props?: CountWorkspacePermissionGroupsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<CountItemsResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/permissionGroups/countWorkspacePermissionGroups',
        method: 'POST',
      },
      opts
    );
  };
  updatePermissionGroup = async (
    props: UpdatePermissionGroupEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<UpdatePermissionGroupEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/permissionGroups/updatePermissionGroup',
        method: 'POST',
      },
      opts
    );
  };
}
export class PermissionItemsEndpoints extends FimidaraEndpointsBase {
  addItems = async (
    props: AddPermissionItemsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<void> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/permissionItems/addItems',
        method: 'POST',
      },
      opts
    );
  };
  deleteItems = async (
    props: DeletePermissionItemsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<MultipleLongRunningJobResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/permissionItems/deleteItems',
        method: 'DELETE',
      },
      opts
    );
  };
  resolveEntityPermissions = async (
    props: ResolveEntityPermissionsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<ResolveEntityPermissionsEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/permissionItems/resolveEntityPermissions',
        method: 'POST',
      },
      opts
    );
  };
}
export class ResourcesEndpoints extends FimidaraEndpointsBase {
  getResources = async (
    props: GetResourcesEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetResourcesEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/resources/getResources',
        method: 'POST',
      },
      opts
    );
  };
}
export class UsageRecordsEndpoints extends FimidaraEndpointsBase {
  getUsageCosts = async (
    opts?: FimidaraEndpointOpts
  ): Promise<GetUsageCostsEndpointResult> => {
    return this.executeJson(
      {
        path: '/v1/usageRecords/getUsageCosts',
        method: 'POST',
      },
      opts
    );
  };
  getWorkspaceSummedUsage = async (
    props?: GetWorkspaceSummedUsageEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetWorkspaceSummedUsageEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/usageRecords/getWorkspaceSummedUsage',
        method: 'POST',
      },
      opts
    );
  };
  countWorkspaceSummedUsage = async (
    props?: CountWorkspaceSummedUsageEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<CountItemsResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/usageRecords/countWorkspaceSummedUsage',
        method: 'POST',
      },
      opts
    );
  };
}
export class WorkspacesEndpoints extends FimidaraEndpointsBase {
  getWorkspace = async (
    props?: GetWorkspaceEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetWorkspaceEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/workspaces/getWorkspace',
        method: 'POST',
      },
      opts
    );
  };
  updateWorkspace = async (
    props: UpdateWorkspaceEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<UpdateWorkspaceEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/workspaces/updateWorkspace',
        method: 'POST',
      },
      opts
    );
  };
}
export class FileBackendsEndpoints extends FimidaraEndpointsBase {
  addMount = async (
    props: AddFileBackendMountEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<AddFileBackendMountEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/fileBackends/addMount',
        method: 'POST',
      },
      opts
    );
  };
  deleteMount = async (
    props: DeleteFileBackendMountEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<LongRunningJobResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/fileBackends/deleteMount',
        method: 'DELETE',
      },
      opts
    );
  };
  getMount = async (
    props: GetFileBackendMountEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetFileBackendMountEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/fileBackends/getMount',
        method: 'POST',
      },
      opts
    );
  };
  getMounts = async (
    props?: GetFileBackendMountsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetFileBackendMountsEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/fileBackends/getMounts',
        method: 'POST',
      },
      opts
    );
  };
  countMounts = async (
    props?: CountFileBackendMountsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<CountItemsResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/fileBackends/countMounts',
        method: 'POST',
      },
      opts
    );
  };
  updateMount = async (
    props: UpdateFileBackendMountEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<UpdateFileBackendMountEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/fileBackends/updateMount',
        method: 'POST',
      },
      opts
    );
  };
  resolveMounts = async (
    props?: ResolveFileBackendMountsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<ResolveFileBackendMountsEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/fileBackends/resolveMounts',
        method: 'POST',
      },
      opts
    );
  };
  addConfig = async (
    props: AddFileBackendConfigEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<AddFileBackendConfigEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/fileBackends/addConfig',
        method: 'POST',
      },
      opts
    );
  };
  deleteConfig = async (
    props: DeleteFileBackendConfigEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<LongRunningJobResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/fileBackends/deleteConfig',
        method: 'DELETE',
      },
      opts
    );
  };
  getConfig = async (
    props: GetFileBackendConfigEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetFileBackendConfigEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/fileBackends/getConfig',
        method: 'POST',
      },
      opts
    );
  };
  getConfigs = async (
    props?: GetFileBackendConfigsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetFileBackendConfigsEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/fileBackends/getConfigs',
        method: 'POST',
      },
      opts
    );
  };
  countConfigs = async (
    props?: CountFileBackendConfigsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<CountItemsResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/fileBackends/countConfigs',
        method: 'POST',
      },
      opts
    );
  };
  updateConfig = async (
    props: UpdateFileBackendConfigEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<UpdateFileBackendConfigEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/fileBackends/updateConfig',
        method: 'POST',
      },
      opts
    );
  };
}
export class PresignedPathsEndpoints extends FimidaraEndpointsBase {
  issuePresignedPath = async (
    props?: IssuePresignedPathEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<IssuePresignedPathEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/presignedPaths/issuePresignedPath',
        method: 'POST',
      },
      opts
    );
  };
  getPresignedPaths = async (
    props?: GetPresignedPathsForFilesEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetPresignedPathsForFilesEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/presignedPaths/getPresignedPaths',
        method: 'POST',
      },
      opts
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
  workspaces = new WorkspacesEndpoints(this.config, this);
  fileBackends = new FileBackendsEndpoints(this.config, this);
  presignedPaths = new PresignedPathsEndpoints(this.config, this);
}
