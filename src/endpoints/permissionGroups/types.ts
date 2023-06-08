import {LongRunningJobResult} from '../jobs/types';
import {
  CountItemsEndpointResult,
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {
  AddPermissionGroupEndpoint,
  AddPermissionGroupEndpointParams,
  AddPermissionGroupEndpointResult,
} from './addPermissionGroup/types';
import {
  AssignPermissionGroupsEndpoint,
  AssignPermissionGroupsEndpointParams,
} from './assignPermissionGroups/types';
import {
  CountWorkspacePermissionGroupsEndpoint,
  CountWorkspacePermissionGroupsEndpointParams,
} from './countWorkspacePermissionGroups/types';
import {
  DeletePermissionGroupEndpoint,
  DeletePermissionGroupEndpointParams,
} from './deletePermissionGroup/types';
import {
  GetEntityAssignedPermissionGroupsEndpoint,
  GetEntityAssignedPermissionGroupsEndpointParams,
  GetEntityAssignedPermissionGroupsEndpointResult,
} from './getEntityAssignedPermissionGroups/types';
import {
  GetPermissionGroupEndpoint,
  GetPermissionGroupEndpointParams,
  GetPermissionGroupEndpointResult,
} from './getPermissionGroup/types';
import {
  GetWorkspacePermissionGroupsEndpoint,
  GetWorkspacePermissionGroupsEndpointParams,
  GetWorkspacePermissionGroupsEndpointResult,
} from './getWorkspacePermissionGroups/types';
import {
  UpdatePermissionGroupEndpoint,
  UpdatePermissionGroupEndpointParams,
  UpdatePermissionGroupEndpointResult,
} from './udpatePermissionGroup/types';
import {
  UnassignPermissionGroupsEndpoint,
  UnassignPermissionGroupsEndpointParams,
} from './unassignPermissionGroups/types';

export type AddPermissionGroupHttpEndpoint = HttpEndpoint<
  AddPermissionGroupEndpoint,
  AddPermissionGroupEndpointParams,
  AddPermissionGroupEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type DeletePermissionGroupHttpEndpoint = HttpEndpoint<
  DeletePermissionGroupEndpoint,
  DeletePermissionGroupEndpointParams,
  LongRunningJobResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetWorkspacePermissionGroupsHttpEndpoint = HttpEndpoint<
  GetWorkspacePermissionGroupsEndpoint,
  GetWorkspacePermissionGroupsEndpointParams,
  GetWorkspacePermissionGroupsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetPermissionGroupHttpEndpoint = HttpEndpoint<
  GetPermissionGroupEndpoint,
  GetPermissionGroupEndpointParams,
  GetPermissionGroupEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type UpdatePermissionGroupHttpEndpoint = HttpEndpoint<
  UpdatePermissionGroupEndpoint,
  UpdatePermissionGroupEndpointParams,
  UpdatePermissionGroupEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type CountWorkspacePermissionGroupsHttpEndpoint = HttpEndpoint<
  CountWorkspacePermissionGroupsEndpoint,
  CountWorkspacePermissionGroupsEndpointParams,
  CountItemsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type AssignPermissionGroupsHttpEndpoint = HttpEndpoint<
  AssignPermissionGroupsEndpoint,
  AssignPermissionGroupsEndpointParams,
  {},
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  {}
>;
export type UnassignPermissionGroupsHttpEndpoint = HttpEndpoint<
  UnassignPermissionGroupsEndpoint,
  UnassignPermissionGroupsEndpointParams,
  {},
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  {}
>;
export type GetEntityAssignedPermissionGroupsHttpEndpoint = HttpEndpoint<
  GetEntityAssignedPermissionGroupsEndpoint,
  GetEntityAssignedPermissionGroupsEndpointParams,
  GetEntityAssignedPermissionGroupsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;

export type PermissionGroupsExportedEndpoints = {
  addPermissionGroup: ExportedHttpEndpointWithMddocDefinition<AddPermissionGroupHttpEndpoint>;
  deletePermissionGroup: ExportedHttpEndpointWithMddocDefinition<DeletePermissionGroupHttpEndpoint>;
  getWorkspacePermissionGroups: ExportedHttpEndpointWithMddocDefinition<GetWorkspacePermissionGroupsHttpEndpoint>;
  getPermissionGroup: ExportedHttpEndpointWithMddocDefinition<GetPermissionGroupHttpEndpoint>;
  updatePermissionGroup: ExportedHttpEndpointWithMddocDefinition<UpdatePermissionGroupHttpEndpoint>;
  countWorkspacePermissionGroups: ExportedHttpEndpointWithMddocDefinition<CountWorkspacePermissionGroupsHttpEndpoint>;
  assignPermissionGroups: ExportedHttpEndpointWithMddocDefinition<AssignPermissionGroupsHttpEndpoint>;
  unassignPermissionGroups: ExportedHttpEndpointWithMddocDefinition<UnassignPermissionGroupsHttpEndpoint>;
  getEntityAssignedPermissionGroups: ExportedHttpEndpointWithMddocDefinition<GetEntityAssignedPermissionGroupsHttpEndpoint>;
};
