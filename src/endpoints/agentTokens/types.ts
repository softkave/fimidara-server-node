import {MddocTypeHttpEndpoint} from '../../mddoc/mddoc';
import {ExportedHttpEndpoint, InferEndpointParams, InferEndpointResult} from '../types';
import {AddAgentTokenEndpoint} from './addToken/types';
import {DeleteAgentTokenEndpoint} from './deleteToken/types';
import {GetAgentTokenEndpoint} from './getToken/types';
import {GetWorkspaceAgentTokenEndpoint} from './getWorkspaceTokens/types';
import {UpdateAgentTokenEndpoint} from './updateToken/types';

export type AgentTokensExportedEndpoints = {
  addToken: ExportedHttpEndpoint<
    AddAgentTokenEndpoint,
    MddocTypeHttpEndpoint<{
      requestBody: InferEndpointParams<AddAgentTokenEndpoint>;
      responseBody: InferEndpointResult<AddAgentTokenEndpoint>;
    }>
  >;
  deleteToken: ExportedHttpEndpoint<DeleteAgentTokenEndpoint>;
  getWorkspaceTokens: ExportedHttpEndpoint<GetWorkspaceAgentTokenEndpoint>;
  getToken: ExportedHttpEndpoint<GetAgentTokenEndpoint>;
  updateToken: ExportedHttpEndpoint<UpdateAgentTokenEndpoint>;
};
