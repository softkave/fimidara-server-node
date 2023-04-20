import {AgentTokensExportedEndpoints} from './agentTokens/types';

export type FimidaraExportedHttpEndpoints = {
  agentTokens: AgentTokensExportedEndpoints;
  collaborationRequests: AgentTokensExportedEndpoints;
  collaborators: AgentTokensExportedEndpoints;
  files: AgentTokensExportedEndpoints;
  folders: AgentTokensExportedEndpoints;
  jobs: AgentTokensExportedEndpoints;
  permissionGroups: AgentTokensExportedEndpoints;
  permissionItems: AgentTokensExportedEndpoints;
  resources: AgentTokensExportedEndpoints;
  usageRecords: AgentTokensExportedEndpoints;
  user: AgentTokensExportedEndpoints;
  workspaces: AgentTokensExportedEndpoints;
};
