import {Express} from 'express';
import {forEach, get, set} from 'lodash';
import {indexArray} from '../utils/indexArray';
import {agentTokensExportedEndpoints} from './agentTokens/endpoints';
import {AgentTokensExportedEndpoints} from './agentTokens/types';
import {collaborationRequestsExportedEndpoints} from './collaborationRequests/endpoints';
import {CollaborationRequestsExportedEndpoints} from './collaborationRequests/types';
import {collaboratorsExportedEndpoints} from './collaborators/endpoints';
import {CollaboratorsExportedEndpoints} from './collaborators/types';
import {BaseContext} from './contexts/types';
import {filesExportedEndpoints} from './files/endpoints';
import {FilesExportedEndpoints} from './files/types';
import {foldersExportedEndpoints} from './folders/endpoints';
import {FoldersExportedEndpoints} from './folders/types';
import {jobsExportedEndpoints} from './jobs/endpoints';
import {JobsExportedEndpoints} from './jobs/types';
import {permissionGroupsExportedEndpoints} from './permissionGroups/endpoints';
import {PermissionGroupsExportedEndpoints} from './permissionGroups/types';
import {permissionItemsExportedEndpoints} from './permissionItems/endpoints';
import {PermissionItemsExportedEndpoints} from './permissionItems/types';
import {resourcesExportedEndpoints} from './resources/endpoints';
import {ResourcesExportedEndpoints} from './resources/types';
import {ExportedHttpEndpoint} from './types';
import {usageRecordsExportedEndpoints} from './usageRecords/endpoints';
import {UsageRecordsExportedEndpoints} from './usageRecords/types';
import {usersExportedEndpoints} from './users/endpoints';
import {UsersExportedEndpoints} from './users/types';
import {registerExpressRouteFromEndpoint} from './utils';
import {workspacesExportedEndpoints} from './workspaces/endpoints';
import {WorkspacesExportedEndpoints} from './workspaces/types';

export type AppExportedHttpEndpoints = Record<string, Record<string, ExportedHttpEndpoint<any>>>;

export type FimidaraExportedHttpEndpoints = {
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
};

export const fimidaraExportedHttpEndpoints: FimidaraExportedHttpEndpoints = {
  agentTokens: agentTokensExportedEndpoints,
  collaborationRequests: collaborationRequestsExportedEndpoints,
  collaborators: collaboratorsExportedEndpoints,
  files: filesExportedEndpoints,
  folders: foldersExportedEndpoints,
  jobs: jobsExportedEndpoints,
  permissionGroups: permissionGroupsExportedEndpoints,
  permissionItems: permissionItemsExportedEndpoints,
  resources: resourcesExportedEndpoints,
  usageRecords: usageRecordsExportedEndpoints,
  users: usersExportedEndpoints,
  workspaces: workspacesExportedEndpoints,
};

type ExportedHttpEndpointsKeys<T extends AppExportedHttpEndpoints> = {
  [K in keyof T]?: Array<keyof T[K]>;
};

function getOppositeHttpEndpointsKeys<T extends AppExportedHttpEndpoints>(
  appEndpoints: AppExportedHttpEndpoints,
  publicEndpoints: ExportedHttpEndpointsKeys<T>
) {
  const oppositeEndpoints: ExportedHttpEndpointsKeys<T> = {};
  forEach(publicEndpoints, (groupPublicEndpoints, groupName) => {
    oppositeEndpoints[groupName as keyof T] = [];
    const completeGroupedEndpoints = appEndpoints[groupName];
    const groupPublicEndpointsMap = indexArray(groupPublicEndpoints);

    forEach(completeGroupedEndpoints, (endpoint, endpointName) => {
      if (!groupPublicEndpointsMap[endpointName]) {
        oppositeEndpoints[groupName]?.push(endpointName);
      }
    });
  });

  return oppositeEndpoints;
}

// TODO: how do we fix the TS error this ts-ignore hides away?
// @ts-ignore
export const fimidaraPublicHttpEndpointKeys: ExportedHttpEndpointsKeys<FimidaraExportedHttpEndpoints> =
  {
    agentTokens: [
      'addToken',
      'deleteToken',
      'getToken',
      'getWorkspaceTokens',
      'updateToken',
      'countWorkspaceTokens',
    ],
    collaborationRequests: [
      'countUserRequests',
      'countWorkspaceRequests',
      'deleteRequest',
      'getUserRequest',
      'getUserRequests',
      'getWorkspaceRequest',
      'getWorkspaceRequests',
      'respondToRequest',
      'revokeRequest',
      'sendRequest',
      'updateRequest',
    ],
    collaborators: [
      'countWorkspaceCollaborators',
      'getCollaborator',
      'getWorkspaceCollaborators',
      'removeCollaborator',
    ],
    files: ['deleteFile', 'getFileDetails', 'readFile', 'updateFileDetails', 'uploadFile'],
    folders: ['addFolder', 'countFolderContent', 'deleteFolder', 'getFolder', 'updateFolder'],
    jobs: ['getJobStatus'],
    permissionGroups: [
      'addPermissionGroup',
      'deletePermissionGroup',
      'getPermissionGroup',
      'getWorkspacePermissionGroups',
      'updatePermissionGroup',
      'assignPermissionGroups',
      'getEntityAssignedPermissionGroups',
      'countWorkspacePermissionGroups',
    ],
    permissionItems: ['addItems', 'deleteItems'],
    resources: ['getResources'],
    usageRecords: ['getUsageCosts', 'getWorkspaceSummedUsage', 'countWorkspaceSummedUsage'],
    users: ['getUserData'],
    workspaces: [
      'getWorkspace',
      'updateWorkspace',
      'deleteWorkspace',
      'getUserWorkspaces',
      'addWorkspace',
      'countUserWorkspaces',
    ],
  };

export const fimidaraPrivateHttpEndpointKeys = getOppositeHttpEndpointsKeys(
  // @ts-ignore
  fimidaraExportedHttpEndpoints,
  fimidaraPublicHttpEndpoints
);

function extractEndpointsUsingEndpointkeys(
  endpoints: AppExportedHttpEndpoints,
  keys: ExportedHttpEndpointsKeys<AppExportedHttpEndpoints>
) {
  const extractedEndpoints: AppExportedHttpEndpoints = {};

  forEach(keys, (endpointNameList, groupName) => {
    endpointNameList?.forEach(endpointName => {
      const key = `${groupName}.${endpointName}`;
      const endpoint = get(endpoints, key);
      if (endpoint) set(extractedEndpoints, key, endpoint);
    });
  });

  return extractedEndpoints;
}

export const fimidaraPublicHttpEndpoints = extractEndpointsUsingEndpointkeys(
  fimidaraExportedHttpEndpoints,
  fimidaraPublicHttpEndpointKeys
);
export const fimidaraPrivateHttpEndpoints = extractEndpointsUsingEndpointkeys(
  fimidaraExportedHttpEndpoints,
  fimidaraPrivateHttpEndpointKeys
);

function setupAppHttpEndpoints(
  ctx: BaseContext,
  app: Express,
  endpointsMap: AppExportedHttpEndpoints
) {
  forEach(endpointsMap, groupEndpoints => {
    forEach(groupEndpoints, endpoint => {
      registerExpressRouteFromEndpoint(ctx, endpoint, app);
    });
  });
}

export function setupFimidaraHttpEndpoints(ctx: BaseContext, app: Express) {
  // @ts-ignore
  setupAppHttpEndpoints(ctx, app, fimidaraExportedHttpEndpoints);
}
