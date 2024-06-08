import {Express} from 'express';
import {forEach, isArray, isObject} from 'lodash-es';
import {getAgentTokenPublicHttpEndpoints} from './agentTokens/endpoints.js';
import {AgentTokensExportedEndpoints} from './agentTokens/types.js';
import {getCollaborationRequestsPublicHttpEndpoints} from './collaborationRequests/endpoints.js';
import {CollaborationRequestsExportedEndpoints} from './collaborationRequests/types.js';
import {
  getCollaboratorsPrivateHttpEndpoints,
  getCollaboratorsPublicHttpEndpoints,
} from './collaborators/endpoints.js';
import {
  CollaboratorsPrivateExportedEndpoints,
  CollaboratorsPublicExportedEndpoints,
} from './collaborators/types.js';
import {getFileBackendsPublicHttpEndpoints} from './fileBackends/endpoints.js';
import {FileBackendsExportedEndpoints} from './fileBackends/types.js';
import {getFilesPublicHttpEndpoints} from './files/endpoints.js';
import {FilesExportedEndpoints} from './files/types.js';
import {getFoldersPublicHttpEndpoints} from './folders/endpoints.js';
import {FoldersExportedEndpoints} from './folders/types.js';
import {getInternalsPrivateHttpEndpoints} from './internal/endpoints.js';
import {InternalsPrivateExportedEndpoints} from './internal/types.js';
import {getJobsPublicHttpEndpoints} from './jobs/endpoints.js';
import {JobsExportedEndpoints} from './jobs/types.js';
import {getPermissionGroupsPublicHttpEndpoints} from './permissionGroups/endpoints.js';
import {PermissionGroupsExportedEndpoints} from './permissionGroups/types.js';
import {getPermissionItemsPublicHttpEndpoints} from './permissionItems/endpoints.js';
import {PermissionItemsExportedEndpoints} from './permissionItems/types.js';
import {getPresignedPathsPublicHttpEndpoints} from './presignedPaths/endpoints.js';
import {PresignedPathsExportedEndpoints} from './presignedPaths/types.js';
import {getResourcesPublicHttpEndpoints} from './resources/endpoints.js';
import {ResourcesExportedEndpoints} from './resources/types.js';
import {ExportedHttpEndpointWithMddocDefinition} from './types.js';
import {getUsageRecordsPublicHttpEndpoints} from './usageRecords/endpoints.js';
import {UsageRecordsExportedEndpoints} from './usageRecords/types.js';
import {
  getUsersPrivateHttpEndpoints,
  getUsersPublicHttpEndpoints,
} from './users/endpoints.js';
import {
  UsersPrivateExportedEndpoints,
  UsersPublicExportedEndpoints,
} from './users/types.js';
import {registerExpressRouteFromEndpoint} from './utils.js';
import {getWorkspacesPublicHttpEndpoints} from './workspaces/endpoints.js';
import {WorkspacesExportedEndpoints} from './workspaces/types.js';

export type AppExportedHttpEndpoints = Array<
  ExportedHttpEndpointWithMddocDefinition<any>
>;

type RecordExportedHttpEndpoints = Record<
  string,
  | ExportedHttpEndpointWithMddocDefinition<any>
  | Array<ExportedHttpEndpointWithMddocDefinition<any>>
  | /** RecordExportedHttpEndpoints */ Record<string, any>
>;

type FimidaraPublicExportedHttpEndpoints = {
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
  fileBackends: FileBackendsExportedEndpoints;
  presignedPaths: PresignedPathsExportedEndpoints;
};

type FimidaraPrivateExportedHttpEndpoints = {
  users: UsersPrivateExportedEndpoints;
  collaborators: CollaboratorsPrivateExportedEndpoints;
  internal: InternalsPrivateExportedEndpoints;
};

function getFimidaraRawPublicHttpEndpoints() {
  const endpoints: FimidaraPublicExportedHttpEndpoints = {
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
    fileBackends: getFileBackendsPublicHttpEndpoints(),
    presignedPaths: getPresignedPathsPublicHttpEndpoints(),
  };
  return endpoints;
}
function getFimidaraRawPrivateHttpEndpoints() {
  const endpoints: FimidaraPrivateExportedHttpEndpoints = {
    users: getUsersPrivateHttpEndpoints(),
    collaborators: getCollaboratorsPrivateHttpEndpoints(),
    internal: getInternalsPrivateHttpEndpoints(),
  };
  return endpoints;
}

function isExportedHttpEndpoint(
  item: any
): item is ExportedHttpEndpointWithMddocDefinition {
  return (
    item &&
    (item as ExportedHttpEndpointWithMddocDefinition<any>).fn &&
    (item as ExportedHttpEndpointWithMddocDefinition<any>).mddocHttpDefinition
  );
}

function compileEndpoints(
  endpointsMap: RecordExportedHttpEndpoints
): AppExportedHttpEndpoints {
  let endpoints: AppExportedHttpEndpoints = [];
  forEach(endpointsMap, e1 => {
    if (isExportedHttpEndpoint(e1)) {
      endpoints.push(e1);
    } else if (isArray(e1)) {
      endpoints = endpoints.concat(e1);
    } else if (isObject(e1)) {
      endpoints = endpoints.concat(compileEndpoints(e1));
    }
  });
  return endpoints;
}

export function getFimidaraPublicHttpEndpoints() {
  return compileEndpoints(getFimidaraRawPublicHttpEndpoints());
}
export function getFimidaraPrivateHttpEndpoints() {
  return compileEndpoints(getFimidaraRawPrivateHttpEndpoints());
}

function setupAppHttpEndpoints(
  app: Express,
  endpoints: AppExportedHttpEndpoints
) {
  forEach(endpoints, e1 => {
    registerExpressRouteFromEndpoint(e1, app);
  });
}

export function setupFimidaraHttpEndpoints(app: Express) {
  setupAppHttpEndpoints(app, getFimidaraPublicHttpEndpoints());
  setupAppHttpEndpoints(app, getFimidaraPrivateHttpEndpoints());
}
