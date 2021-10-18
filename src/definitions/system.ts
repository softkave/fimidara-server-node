import {
  IBaseTokenData,
  TokenType,
} from '../endpoints/contexts/ProgramAccessTokenContext';

export enum SessionAgentType {
  User = 'user',
  ProgramAccessToken = 'program-access-token',
  ClientAssignedToken = 'client-assigned-token',
}

export interface ISessionAgent {
  agentId: string;
  agentType: SessionAgentType;
  tokenId: string;
  tokenType: TokenType;
  incomingTokenData?: IBaseTokenData | null;
}

export interface IAgent {
  agentId: string;
  agentType: SessionAgentType;
}

export enum ResourceType {
  Bucket = 'bucket',
  Folder = 'folder',
  File = 'file',
}
