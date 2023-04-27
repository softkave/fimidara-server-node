import {Express} from 'express';
import {forEach} from 'lodash';
import {getAgentTokenPublicHttpEndpoints} from './agentTokens/endpoints';
import {AgentTokensExportedEndpoints} from './agentTokens/types';
import {getCollaborationRequestsPublicHttpEndpoints} from './collaborationRequests/endpoints';
import {CollaborationRequestsExportedEndpoints} from './collaborationRequests/types';
import {
  getCollaboratorsPrivateHttpEndpoints,
  getCollaboratorsPublicHttpEndpoints,
} from './collaborators/endpoints';
import {
  CollaboratorsPrivateExportedEndpoints,
  CollaboratorsPublicExportedEndpoints,
} from './collaborators/types';
import {BaseContextType} from './contexts/types';
import {getFilesPublicHttpEndpoints} from './files/endpoints';
import {FilesExportedEndpoints} from './files/types';
import {getFoldersPublicHttpEndpoints} from './folders/endpoints';
import {FoldersExportedEndpoints} from './folders/types';
import {getJobsPublicHttpEndpoints} from './jobs/endpoints';
import {JobsExportedEndpoints} from './jobs/types';
import {getPermissionGroupsPublicHttpEndpoints} from './permissionGroups/endpoints';
import {PermissionGroupsExportedEndpoints} from './permissionGroups/types';
import {getPermissionItemsPublicHttpEndpoints} from './permissionItems/endpoints';
import {PermissionItemsExportedEndpoints} from './permissionItems/types';
import {getResourcesPublicHttpEndpoints} from './resources/endpoints';
import {ResourcesExportedEndpoints} from './resources/types';
import {ExportedHttpEndpointWithMddocDefinition} from './types';
import {getUsageRecordsPublicHttpEndpoints} from './usageRecords/endpoints';
import {UsageRecordsExportedEndpoints} from './usageRecords/types';
import {getUsersPrivateHttpEndpoints, getUsersPublicHttpEndpoints} from './users/endpoints';
import {UsersPrivateExportedEndpoints, UsersPublicExportedEndpoints} from './users/types';
import {registerExpressRouteFromEndpoint} from './utils';
import {getWorkspacesPublicHttpEndpoints} from './workspaces/endpoints';
import {WorkspacesExportedEndpoints} from './workspaces/types';

export type AppExportedHttpEndpoints = Record<
  string,
  Record<string, ExportedHttpEndpointWithMddocDefinition<any>>
>;

export type FimidaraPublicExportedHttpEndpoints = {
  agentTokens: AgentTokensExportedEndpoints;
  collaborationRequests: CollaborationRequestsExportedEndpoints;
  collaborators: CollaboratorsPublicExportedEndpoints;
  files: FilesExportedEndpoints;
  folders: FoldersExportedEndpoints;
  jobs: JobsExportedEndpoints;
  permissionGroups: PermissionGroupsExportedEndpoints;
  permissionItems: PermissionItemsExportedEndpoints;
  resources: ResourcesExportedEndpoints;
  usageRecords: UsageRecordsExportedEndpoints;
  users: UsersPublicExportedEndpoints;
  workspaces: WorkspacesExportedEndpoints;
};
export type FimidaraPrivateExportedHttpEndpoints = {
  users: UsersPrivateExportedEndpoints;
  collaborators: CollaboratorsPrivateExportedEndpoints;
};

export function getFimidaraPublicHttpEndpoints() {
  const fimidaraExportedHttpEndpoints: FimidaraPublicExportedHttpEndpoints = {
    agentTokens: getAgentTokenPublicHttpEndpoints(),
    collaborationRequests: getCollaborationRequestsPublicHttpEndpoints(),
    collaborators: getCollaboratorsPublicHttpEndpoints(),
    files: getFilesPublicHttpEndpoints(),
    folders: getFoldersPublicHttpEndpoints(),
    jobs: getJobsPublicHttpEndpoints(),
    permissionGroups: getPermissionGroupsPublicHttpEndpoints(),
    permissionItems: getPermissionItemsPublicHttpEndpoints(),
    resources: getResourcesPublicHttpEndpoints(),
    usageRecords: getUsageRecordsPublicHttpEndpoints(),
    users: getUsersPublicHttpEndpoints(),
    workspaces: getWorkspacesPublicHttpEndpoints(),
  };
  return fimidaraExportedHttpEndpoints;
}

export function getFimidaraPrivateHttpEndpoints() {
  const fimidaraExportedHttpEndpoints: FimidaraPrivateExportedHttpEndpoints = {
    users: getUsersPrivateHttpEndpoints(),
    collaborators: getCollaboratorsPrivateHttpEndpoints(),
  };
  return fimidaraExportedHttpEndpoints;
}

function setupAppHttpEndpoints(
  ctx: BaseContextType,
  app: Express,
  endpointsMap: AppExportedHttpEndpoints
) {
  forEach(endpointsMap, groupEndpoints => {
    forEach(groupEndpoints, endpoint => {
      registerExpressRouteFromEndpoint(ctx, endpoint, app);
    });
  });
}

export function setupFimidaraHttpEndpoints(ctx: BaseContextType, app: Express) {
  setupAppHttpEndpoints(ctx, app, getFimidaraPublicHttpEndpoints() as any);
  setupAppHttpEndpoints(ctx, app, getFimidaraPrivateHttpEndpoints() as any);
}
