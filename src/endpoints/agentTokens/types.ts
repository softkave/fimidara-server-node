import {FieldObjectType} from '../../mddoc/mddoc.js';
import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {AddAgentTokenEndpoint, AddAgentTokenEndpointParams} from './addToken/types.js';
import {CountWorkspaceAgentTokensEndpoint} from './countWorkspaceTokens/types.js';
import {DeleteAgentTokenEndpoint} from './deleteToken/types.js';
import {GetAgentTokenEndpoint} from './getToken/types.js';
import {GetWorkspaceAgentTokensEndpoint} from './getWorkspaceTokens/types.js';
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

type TrueOrFalse = FieldObjectType<AddAgentTokenEndpointParams> extends FieldObjectType<any>
  ? true
  : false;

export type AgentTokensExportedEndpoints = {
  addToken: AddAgentTokenHttpEndpoint;
  deleteToken: DeleteAgentTokenHttpEndpoint;
  getWorkspaceTokens: GetWorkspaceAgentTokensHttpEndpoint;
  countWorkspaceTokens: CountWorkspaceAgentTokensHttpEndpoint;
  getToken: GetAgentTokenHttpEndpoint;
  updateToken: UpdateAgentTokenHttpEndpoint;
};
