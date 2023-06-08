import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {
  GetWaitlistedUsersEndpoint,
  GetWaitlistedUsersEndpointParams,
  GetWaitlistedUsersEndpointResult,
} from './getWaitlistedUsers/types';
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

export type InternalsPrivateExportedEndpoints = {
  getWaitlistedUsers: ExportedHttpEndpointWithMddocDefinition<GetWaitlistedUsersHttpEndpoint>;
  upgradeWaitlistedUsers: ExportedHttpEndpointWithMddocDefinition<UpgradeWaitlistedUsersHttpEndpoint>;
};
