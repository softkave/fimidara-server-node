import {LongRunningJobResult} from '../jobs/types';
import {
  CountItemsEndpointResult,
  EndpointOptionalWorkspaceIDParam,
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthRequired,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {
  AddWorkspaceEndpoint,
  AddWorkspaceEndpointParams,
  AddWorkspaceEndpointResult,
} from './addWorkspace/types';
import {CountUserWorkspacesEndpoint} from './countUserWorkspaces/types';
import {DeleteWorkspaceEndpoint} from './deleteWorkspace/types';
import {
  GetUserWorkspacesEndpoint,
  GetUserWorkspacesEndpointParams,
  GetUserWorkspacesEndpointResult,
} from './getUserWorkspaces/types';
import {GetWorkspaceEndpoint, GetWorkspaceEndpointResult} from './getWorkspace/types';
import {
  UpdateWorkspaceEndpoint,
  UpdateWorkspaceEndpointParams,
  UpdateWorkspaceEndpointResult,
} from './updateWorkspace/types';

export type AddWorkspaceHttpEndpoint = HttpEndpoint<
  AddWorkspaceEndpoint,
  AddWorkspaceEndpointParams,
  AddWorkspaceEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type DeleteWorkspaceHttpEndpoint = HttpEndpoint<
  DeleteWorkspaceEndpoint,
  EndpointOptionalWorkspaceIDParam,
  LongRunningJobResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetUserWorkspacesHttpEndpoint = HttpEndpoint<
  GetUserWorkspacesEndpoint,
  GetUserWorkspacesEndpointParams,
  GetUserWorkspacesEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type CountUserWorkspacesHttpEndpoint = HttpEndpoint<
  CountUserWorkspacesEndpoint,
  {},
  CountItemsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetWorkspaceHttpEndpoint = HttpEndpoint<
  GetWorkspaceEndpoint,
  EndpointOptionalWorkspaceIDParam,
  GetWorkspaceEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type UpdateWorkspaceHttpEndpoint = HttpEndpoint<
  UpdateWorkspaceEndpoint,
  UpdateWorkspaceEndpointParams,
  UpdateWorkspaceEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;

export type WorkspacesExportedEndpoints = {
  addWorkspace: ExportedHttpEndpointWithMddocDefinition<AddWorkspaceHttpEndpoint>;
  deleteWorkspace: ExportedHttpEndpointWithMddocDefinition<DeleteWorkspaceHttpEndpoint>;
  getUserWorkspaces: ExportedHttpEndpointWithMddocDefinition<GetUserWorkspacesHttpEndpoint>;
  countUserWorkspaces: ExportedHttpEndpointWithMddocDefinition<CountUserWorkspacesHttpEndpoint>;
  getWorkspace: ExportedHttpEndpointWithMddocDefinition<GetWorkspaceHttpEndpoint>;
  updateWorkspace: ExportedHttpEndpointWithMddocDefinition<UpdateWorkspaceHttpEndpoint>;
};
