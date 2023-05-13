import {LongRunningJobResult} from '../jobs/types';
import {
  CountItemsEndpointResult,
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {
  AddAgentTokenEndpoint,
  AddAgentTokenEndpointParams,
  AddAgentTokenEndpointResult,
} from './addToken/types';
import {
  CountWorkspaceAgentTokensEndpoint,
  CountWorkspaceAgentTokensEndpointParams,
} from './countWorkspaceTokens/types';
import {DeleteAgentTokenEndpoint, DeleteAgentTokenEndpointParams} from './deleteToken/types';
import {
  GetAgentTokenEndpoint,
  GetAgentTokenEndpointParams,
  GetAgentTokenEndpointResult,
} from './getToken/types';
import {
  GetWorkspaceAgentTokensEndpoint,
  GetWorkspaceAgentTokensEndpointParams,
  GetWorkspaceAgentTokensEndpointResult,
} from './getWorkspaceTokens/types';
import {
  UpdateAgentTokenEndpoint,
  UpdateAgentTokenEndpointParams,
  UpdateAgentTokenEndpointResult,
} from './updateToken/types';

export type AddAgentTokenHttpEndpoint = HttpEndpoint<
  AddAgentTokenEndpoint,
  AddAgentTokenEndpointParams,
  AddAgentTokenEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type DeleteAgentTokenHttpEndpoint = HttpEndpoint<
  DeleteAgentTokenEndpoint,
  DeleteAgentTokenEndpointParams,
  LongRunningJobResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetWorkspaceAgentTokensHttpEndpoint = HttpEndpoint<
  GetWorkspaceAgentTokensEndpoint,
  GetWorkspaceAgentTokensEndpointParams,
  GetWorkspaceAgentTokensEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type CountWorkspaceAgentTokensHttpEndpoint = HttpEndpoint<
  CountWorkspaceAgentTokensEndpoint,
  CountWorkspaceAgentTokensEndpointParams,
  CountItemsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetAgentTokenHttpEndpoint = HttpEndpoint<
  GetAgentTokenEndpoint,
  GetAgentTokenEndpointParams,
  GetAgentTokenEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type UpdateAgentTokenHttpEndpoint = HttpEndpoint<
  UpdateAgentTokenEndpoint,
  UpdateAgentTokenEndpointParams,
  UpdateAgentTokenEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;

export type AgentTokensExportedEndpoints = {
  addToken: ExportedHttpEndpointWithMddocDefinition<AddAgentTokenHttpEndpoint>;
  deleteToken: ExportedHttpEndpointWithMddocDefinition<DeleteAgentTokenHttpEndpoint>;
  getWorkspaceTokens: ExportedHttpEndpointWithMddocDefinition<GetWorkspaceAgentTokensHttpEndpoint>;
  countWorkspaceTokens: ExportedHttpEndpointWithMddocDefinition<CountWorkspaceAgentTokensHttpEndpoint>;
  getToken: ExportedHttpEndpointWithMddocDefinition<GetAgentTokenHttpEndpoint>;
  updateToken: ExportedHttpEndpointWithMddocDefinition<UpdateAgentTokenHttpEndpoint>;
};
