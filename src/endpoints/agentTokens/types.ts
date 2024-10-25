import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {AddAgentTokenEndpoint} from './addToken/types.js';
import {CountWorkspaceAgentTokensEndpoint} from './countWorkspaceTokens/types.js';
import {DeleteAgentTokenEndpoint} from './deleteToken/types.js';
import {EncodeAgentTokenEndpoint} from './encodeToken/types.js';
import {GetAgentTokenEndpoint} from './getToken/types.js';
import {GetWorkspaceAgentTokensEndpoint} from './getWorkspaceTokens/types.js';
import {RefreshAgentTokenEndpoint} from './refreshToken/types.js';
import {UpdateAgentTokenEndpoint} from './updateToken/types.js';

export type AddAgentTokenHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<AddAgentTokenEndpoint>;
export type DeleteAgentTokenHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<DeleteAgentTokenEndpoint>;
export type GetWorkspaceAgentTokensHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetWorkspaceAgentTokensEndpoint>;
export type CountWorkspaceAgentTokensHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<CountWorkspaceAgentTokensEndpoint>;
export type GetAgentTokenHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetAgentTokenEndpoint>;
export type UpdateAgentTokenHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<UpdateAgentTokenEndpoint>;
export type RefreshAgentTokenHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<RefreshAgentTokenEndpoint>;
export type EncodeAgentTokenHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<EncodeAgentTokenEndpoint>;

export type AgentTokensExportedEndpoints = {
  addToken: AddAgentTokenHttpEndpoint;
  deleteToken: DeleteAgentTokenHttpEndpoint;
  getWorkspaceTokens: GetWorkspaceAgentTokensHttpEndpoint;
  countWorkspaceTokens: CountWorkspaceAgentTokensHttpEndpoint;
  getToken: GetAgentTokenHttpEndpoint;
  updateToken: UpdateAgentTokenHttpEndpoint;
  refreshToken: RefreshAgentTokenHttpEndpoint;
  encodeToken: EncodeAgentTokenHttpEndpoint;
};
