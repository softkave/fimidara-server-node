import {Express} from 'express';
import {forEach, isArray, isObject} from 'lodash-es';
import {getAgentTokenHttpEndpoints} from './agentTokens/endpoints.js';
import {AgentTokensExportedEndpoints} from './agentTokens/types.js';
import {getCollaborationRequestsHttpEndpoints} from './collaborationRequests/endpoints.js';
import {CollaborationRequestsExportedEndpoints} from './collaborationRequests/types.js';
import {getCollaboratorsHttpEndpoints} from './collaborators/endpoints.js';
import {CollaboratorsExportedEndpoints} from './collaborators/types.js';
import {getFileBackendsHttpEndpoints} from './fileBackends/endpoints.js';
import {FileBackendsExportedEndpoints} from './fileBackends/types.js';
import {getFilesHttpEndpoints} from './files/endpoints.js';
import {FilesExportedEndpoints} from './files/types.js';
import {getFoldersHttpEndpoints} from './folders/endpoints.js';
import {FoldersExportedEndpoints} from './folders/types.js';
import {getInternalsHttpEndpoints} from './internal/endpoints.js';
import {InternalsExportedEndpoints} from './internal/types.js';
import {getJobsHttpEndpoints} from './jobs/endpoints.js';
import {JobsExportedEndpoints} from './jobs/types.js';
import {getPermissionGroupsHttpEndpoints} from './permissionGroups/endpoints.js';
import {PermissionGroupsExportedEndpoints} from './permissionGroups/types.js';
import {getPermissionItemsHttpEndpoints} from './permissionItems/endpoints.js';
import {PermissionItemsExportedEndpoints} from './permissionItems/types.js';
import {getPresignedPathsHttpEndpoints} from './presignedPaths/endpoints.js';
import {PresignedPathsExportedEndpoints} from './presignedPaths/types.js';
import {getResourcesHttpEndpoints} from './resources/endpoints.js';
import {ResourcesExportedEndpoints} from './resources/types.js';
import {ExportedHttpEndpointWithMddocDefinition} from './types.js';
import {getUsageRecordsHttpEndpoints} from './usageRecords/endpoints.js';
import {UsageRecordsExportedEndpoints} from './usageRecords/types.js';
import {getUsersHttpEndpoints} from './users/endpoints.js';
import {UsersExportedEndpoints} from './users/types.js';
import {registerExpressRouteFromEndpoint} from './utils.js';
import {getWorkspacesHttpEndpoints} from './workspaces/endpoints.js';
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

type FimidaraExportedHttpEndpoints = {
  agentTokens: AgentTokensExportedEndpoints;
  collaborationRequests: CollaborationRequestsExportedEndpoints;
  collaborators: CollaboratorsExportedEndpoints;
  files: FilesExportedEndpoints;
  folders: FoldersExportedEndpoints;
  jobs: JobsExportedEndpoints;
  permissionGroups: PermissionGroupsExportedEndpoints;
  permissionItems: PermissionItemsExportedEndpoints;
  resources: ResourcesExportedEndpoints;
  usageRecords: UsageRecordsExportedEndpoints;
  users: UsersExportedEndpoints;
  workspaces: WorkspacesExportedEndpoints;
  fileBackends: FileBackendsExportedEndpoints;
  presignedPaths: PresignedPathsExportedEndpoints;
  internal: InternalsExportedEndpoints;
};

function getFimidaraRawHttpEndpoints() {
  const endpoints: FimidaraExportedHttpEndpoints = {
    agentTokens: getAgentTokenHttpEndpoints(),
    collaborationRequests: getCollaborationRequestsHttpEndpoints(),
    collaborators: getCollaboratorsHttpEndpoints(),
    files: getFilesHttpEndpoints(),
    folders: getFoldersHttpEndpoints(),
    jobs: getJobsHttpEndpoints(),
    permissionGroups: getPermissionGroupsHttpEndpoints(),
    permissionItems: getPermissionItemsHttpEndpoints(),
    resources: getResourcesHttpEndpoints(),
    usageRecords: getUsageRecordsHttpEndpoints(),
    users: getUsersHttpEndpoints(),
    workspaces: getWorkspacesHttpEndpoints(),
    fileBackends: getFileBackendsHttpEndpoints(),
    presignedPaths: getPresignedPathsHttpEndpoints(),
    internal: getInternalsHttpEndpoints(),
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

export function getFimidaraHttpEndpoints() {
  return compileEndpoints(getFimidaraRawHttpEndpoints());
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
  setupAppHttpEndpoints(app, getFimidaraHttpEndpoints());
}
