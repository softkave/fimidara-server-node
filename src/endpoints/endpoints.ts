import {Express} from 'express';
import {forEach, isArray, isObject} from 'lodash';
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
import {getFileBackendsPublicHttpEndpoints} from './fileBackends/endpoints';
import {FileBackendsExportedEndpoints} from './fileBackends/types';
import {getFilesPublicHttpEndpoints} from './files/endpoints';
import {FilesExportedEndpoints} from './files/types';
import {getFoldersPublicHttpEndpoints} from './folders/endpoints';
import {FoldersExportedEndpoints} from './folders/types';
import {getInternalsPrivateHttpEndpoints} from './internal/endpoints';
import {InternalsPrivateExportedEndpoints} from './internal/types';
import {getJobsPublicHttpEndpoints} from './jobs/endpoints';
import {JobsExportedEndpoints} from './jobs/types';
import {getPermissionGroupsPublicHttpEndpoints} from './permissionGroups/endpoints';
import {PermissionGroupsExportedEndpoints} from './permissionGroups/types';
import {getPermissionItemsPublicHttpEndpoints} from './permissionItems/endpoints';
import {PermissionItemsExportedEndpoints} from './permissionItems/types';
import {getPresignedPathsPublicHttpEndpoints} from './presignedPaths/endpoints';
import {PresignedPathsExportedEndpoints} from './presignedPaths/types';
import {getResourcesPublicHttpEndpoints} from './resources/endpoints';
import {ResourcesExportedEndpoints} from './resources/types';
import {ExportedHttpEndpointWithMddocDefinition} from './types';
import {getUsageRecordsPublicHttpEndpoints} from './usageRecords/endpoints';
import {UsageRecordsExportedEndpoints} from './usageRecords/types';
import {
  getUsersPrivateHttpEndpoints,
  getUsersPublicHttpEndpoints,
} from './users/endpoints';
import {UsersPrivateExportedEndpoints, UsersPublicExportedEndpoints} from './users/types';
import {registerExpressRouteFromEndpoint} from './utils';
import {getWorkspacesPublicHttpEndpoints} from './workspaces/endpoints';
import {WorkspacesExportedEndpoints} from './workspaces/types';

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

function setupAppHttpEndpoints(app: Express, endpoints: AppExportedHttpEndpoints) {
  forEach(endpoints, e1 => {
    registerExpressRouteFromEndpoint(e1, app);
  });
}

export function setupFimidaraHttpEndpoints(app: Express) {
  setupAppHttpEndpoints(app, getFimidaraPublicHttpEndpoints());
  setupAppHttpEndpoints(app, getFimidaraPrivateHttpEndpoints());
}
