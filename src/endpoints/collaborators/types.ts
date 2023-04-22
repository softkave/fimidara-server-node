import {LongRunningJobResult} from '../jobs/types';
import {
  CountItemsEndpointResult,
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {
  CountWorkspaceCollaboratorsEndpoint,
  CountWorkspaceCollaboratorsEndpointParams,
} from './countWorkspaceCollaborators/types';
import {
  GetCollaboratorEndpoint,
  GetCollaboratorEndpointParams,
  GetCollaboratorEndpointResult,
} from './getCollaborator/types';
import {
  GetWorkspaceCollaboratorsEndpoint,
  GetWorkspaceCollaboratorsEndpointParams,
  GetWorkspaceCollaboratorsEndpointResult,
} from './getWorkspaceCollaborators/types';
import {
  RemoveCollaboratorEndpoint,
  RemoveCollaboratorEndpointParams,
} from './removeCollaborator/types';

export type GetCollaboratorHttpEndpoint = HttpEndpoint<
  GetCollaboratorEndpoint,
  GetCollaboratorEndpointParams,
  GetCollaboratorEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetWorkspaceCollaboratorsHttpEndpoint = HttpEndpoint<
  GetWorkspaceCollaboratorsEndpoint,
  GetWorkspaceCollaboratorsEndpointParams,
  GetWorkspaceCollaboratorsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type CountWorkspaceCollaboratorsHttpEndpoint = HttpEndpoint<
  CountWorkspaceCollaboratorsEndpoint,
  CountWorkspaceCollaboratorsEndpointParams,
  CountItemsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type RemoveCollaboratorHttpEndpoint = HttpEndpoint<
  RemoveCollaboratorEndpoint,
  RemoveCollaboratorEndpointParams,
  LongRunningJobResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;

export type CollaboratorsExportedEndpoints = {
  getCollaborator: ExportedHttpEndpointWithMddocDefinition<GetCollaboratorHttpEndpoint>;
  getWorkspaceCollaborators: ExportedHttpEndpointWithMddocDefinition<GetWorkspaceCollaboratorsHttpEndpoint>;
  countWorkspaceCollaborators: ExportedHttpEndpointWithMddocDefinition<CountWorkspaceCollaboratorsHttpEndpoint>;
  removeCollaborator: ExportedHttpEndpointWithMddocDefinition<RemoveCollaboratorHttpEndpoint>;
};
