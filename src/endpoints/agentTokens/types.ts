import {FieldObjectType} from '../../mddoc/mddoc';
import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {AddAgentTokenEndpoint, AddAgentTokenEndpointParams} from './addToken/types';
import {CountWorkspaceAgentTokensEndpoint} from './countWorkspaceTokens/types';
import {DeleteAgentTokenEndpoint} from './deleteToken/types';
import {GetAgentTokenEndpoint} from './getToken/types';
import {GetWorkspaceAgentTokensEndpoint} from './getWorkspaceTokens/types';
import {UpdateAgentTokenEndpoint} from './updateToken/types';

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
