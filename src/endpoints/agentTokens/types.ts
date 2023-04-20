import {ExportedHttpEndpoint} from '../types';
import {AddAgentTokenEndpoint} from './addToken/types';
import {CountWorkspaceAgentTokenEndpoint} from './countWorkspaceTokens/types';
import {DeleteAgentTokenEndpoint} from './deleteToken/types';
import {GetAgentTokenEndpoint} from './getToken/types';
import {GetWorkspaceAgentTokenEndpoint} from './getWorkspaceTokens/types';
import {UpdateAgentTokenEndpoint} from './updateToken/types';

export type AgentTokensExportedEndpoints = {
  addToken: ExportedHttpEndpoint<AddAgentTokenEndpoint>;
  deleteToken: ExportedHttpEndpoint<DeleteAgentTokenEndpoint>;
  getWorkspaceTokens: ExportedHttpEndpoint<GetWorkspaceAgentTokenEndpoint>;
  countWorkspaceTokens: ExportedHttpEndpoint<CountWorkspaceAgentTokenEndpoint>;
  getToken: ExportedHttpEndpoint<GetAgentTokenEndpoint>;
  updateToken: ExportedHttpEndpoint<UpdateAgentTokenEndpoint>;
};
