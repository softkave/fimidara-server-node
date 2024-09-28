import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {GetUsersEndpoint} from './getUsers/types.js';
import {GetWaitlistedUsersEndpoint} from './getWaitlistedUsers/types.js';
import {GetWorkspacesEndpoint} from './getWorkspaces/types.js';
import {UpgradeWaitlistedUsersEndpoint} from './upgradeWaitlistedUsers/types.js';

export type GetWaitlistedUsersHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetWaitlistedUsersEndpoint>;
export type UpgradeWaitlistedUsersHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<UpgradeWaitlistedUsersEndpoint>;
export type GetUsersHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetUsersEndpoint>;
export type GetWorkspacesHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetWorkspacesEndpoint>;

export type InternalsExportedEndpoints = {
  getWaitlistedUsers: GetWaitlistedUsersHttpEndpoint;
  upgradeWaitlistedUsers: UpgradeWaitlistedUsersHttpEndpoint;
  getUsers: GetUsersHttpEndpoint;
  getWorkspaces: GetWorkspacesHttpEndpoint;
};
