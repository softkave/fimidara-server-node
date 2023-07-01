import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {GetUsersEndpoint, GetUsersEndpointParams, GetUsersEndpointResult} from './getUsers/types';
import {
  GetWaitlistedUsersEndpoint,
  GetWaitlistedUsersEndpointParams,
  GetWaitlistedUsersEndpointResult,
} from './getWaitlistedUsers/types';
import {
  GetWorkspacesEndpoint,
  GetWorkspacesEndpointParams,
  GetWorkspacesEndpointResult,
} from './getWorkspaces/types';
import {
  UpgradeWaitlistedUsersEndpoint,
  UpgradeWaitlistedUsersEndpointParams,
} from './upgradeWaitlistedUsers/types';

export type GetWaitlistedUsersHttpEndpoint = HttpEndpoint<
  GetWaitlistedUsersEndpoint,
  GetWaitlistedUsersEndpointParams,
  GetWaitlistedUsersEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type UpgradeWaitlistedUsersHttpEndpoint = HttpEndpoint<
  UpgradeWaitlistedUsersEndpoint,
  UpgradeWaitlistedUsersEndpointParams,
  {},
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetUsersHttpEndpoint = HttpEndpoint<
  GetUsersEndpoint,
  GetUsersEndpointParams,
  GetUsersEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetWorkspacesHttpEndpoint = HttpEndpoint<
  GetWorkspacesEndpoint,
  GetWorkspacesEndpointParams,
  GetWorkspacesEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;

export type InternalsPrivateExportedEndpoints = {
  getWaitlistedUsers: ExportedHttpEndpointWithMddocDefinition<GetWaitlistedUsersHttpEndpoint>;
  upgradeWaitlistedUsers: ExportedHttpEndpointWithMddocDefinition<UpgradeWaitlistedUsersHttpEndpoint>;
  getUsers: ExportedHttpEndpointWithMddocDefinition<GetUsersHttpEndpoint>;
  getWorkspaces: ExportedHttpEndpointWithMddocDefinition<GetWorkspacesHttpEndpoint>;
};
