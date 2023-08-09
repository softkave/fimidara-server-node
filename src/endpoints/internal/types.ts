import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {GetUsersEndpoint} from './getUsers/types';
import {GetWaitlistedUsersEndpoint} from './getWaitlistedUsers/types';
import {GetWorkspacesEndpoint} from './getWorkspaces/types';
import {UpgradeWaitlistedUsersEndpoint} from './upgradeWaitlistedUsers/types';

export type GetWaitlistedUsersHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetWaitlistedUsersEndpoint>;
export type UpgradeWaitlistedUsersHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<UpgradeWaitlistedUsersEndpoint>;
export type GetUsersHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<GetUsersEndpoint>;
export type GetWorkspacesHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetWorkspacesEndpoint>;

export type InternalsPrivateExportedEndpoints = {
  getWaitlistedUsers: GetWaitlistedUsersHttpEndpoint;
  upgradeWaitlistedUsers: UpgradeWaitlistedUsersHttpEndpoint;
  getUsers: GetUsersHttpEndpoint;
  getWorkspaces: GetWorkspacesHttpEndpoint;
};
