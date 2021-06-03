import {
    IBaseTokenData,
    TokenType,
} from '../endpoints/contexts/ProgramAccessTokenContext';

export enum SessionAgentType {
    User = 'user',
    ProgramAccessToken = 'programAccessToken',
    ClientAssignedToken = 'clientAssignedToken',
}

export interface ISessionAgent {
    agentId: string;
    agentType: SessionAgentType;
    tokenId: string;
    tokenType: TokenType;
    incomingTokenData: IBaseTokenData;
}
