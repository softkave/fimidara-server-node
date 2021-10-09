import {ISessionAgent, SessionAgentType} from '../../definitions/system';
import {IUser} from '../../definitions/user';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import RequestData from '../RequestData';
import {InvalidCredentialsError, PermissionDeniedError} from '../user/errors';
import {IBaseContext} from './BaseContext';
import {TokenType} from './ProgramAccessTokenContext';
import {JWTEndpoint} from './UserTokenContext';

// TODO: when retrieving cached tokens, check that the token contains
// the input JWTEndpoints

export interface ISessionContext {
  getAgent: (
    ctx: IBaseContext,
    data: RequestData,
    permittedAgentTypes?: SessionAgentType[],
    audience?: JWTEndpoint | JWTEndpoint[]
  ) => Promise<ISessionAgent>;
  getUser: (
    ctx: IBaseContext,
    data: RequestData,
    audience?: JWTEndpoint | JWTEndpoint[]
  ) => Promise<IUser>;
}

export default class SessionContext implements ISessionContext {
  public getAgent = wrapFireAndThrowError(
    async (
      ctx: IBaseContext,
      data: RequestData,
      permittedAgentTypes?: SessionAgentType[],
      audience?: JWTEndpoint | JWTEndpoint[]
    ) => {
      if (data.agent) {
        return data.agent;
      }

      let userToken = data.userToken;
      let clientAssignedToken = data.clientAssignedToken;
      let programAccessToken = data.programAccessToken;
      const incomingTokenData = data.incomingTokenData;

      if (!userToken && !clientAssignedToken && !programAccessToken) {
        if (!incomingTokenData) {
          throw new PermissionDeniedError();
        }

        switch (incomingTokenData.sub.type) {
          case TokenType.UserToken: {
            userToken = await ctx.userToken.assertGetTokenById(
              ctx,
              incomingTokenData.sub.id
            );
            data.userToken = userToken;

            if (audience) {
              ctx.userToken.containsAudience(ctx, userToken, audience);
            }

            break;
          }

          case TokenType.ProgramAccessToken: {
            programAccessToken = await ctx.programAccessToken.assertGetTokenById(
              ctx,
              incomingTokenData.sub.id
            );
            data.programAccessToken = programAccessToken;
            break;
          }

          case TokenType.ClientAssignedToken: {
            clientAssignedToken = await ctx.clientAssignedToken.assertGetTokenById(
              ctx,
              incomingTokenData.sub.id
            );
            data.clientAssignedToken = clientAssignedToken;
          }
        }
      }

      if (permittedAgentTypes) {
        const permittedAgent = permittedAgentTypes.find(type => {
          switch (type) {
            case SessionAgentType.User:
              return !!userToken;
            case SessionAgentType.ProgramAccessToken:
              return !!programAccessToken;
            case SessionAgentType.ClientAssignedToken:
              return !!clientAssignedToken;
          }
        });

        if (!permittedAgent) {
          throw new PermissionDeniedError();
        }
      }

      if (userToken) {
        const agent: ISessionAgent = {
          incomingTokenData,
          agentId: userToken.userId,
          agentType: SessionAgentType.User,
          tokenId: userToken.tokenId,
          tokenType: TokenType.UserToken,
        };

        data.agent = agent;
        return agent;
      }

      if (programAccessToken) {
        const agent: ISessionAgent = {
          incomingTokenData,
          agentId: programAccessToken.tokenId,
          agentType: SessionAgentType.ProgramAccessToken,
          tokenId: programAccessToken.tokenId,
          tokenType: TokenType.ProgramAccessToken,
        };

        data.agent = agent;
        return agent;
      }

      if (clientAssignedToken) {
        const agent: ISessionAgent = {
          incomingTokenData,
          agentId: clientAssignedToken.tokenId,
          agentType: SessionAgentType.ClientAssignedToken,
          tokenId: clientAssignedToken.tokenId,
          tokenType: TokenType.ClientAssignedToken,
        };

        data.agent = agent;
        return agent;
      }

      // Control should not get here
      throw new InvalidCredentialsError();
    }
  );

  getUser = wrapFireAndThrowError(
    async (
      ctx: IBaseContext,
      data: RequestData,
      audience?: JWTEndpoint | JWTEndpoint[]
    ) => {
      const agent = await ctx.session.getAgent(
        ctx,
        data,
        [SessionAgentType.User],
        audience
      );

      const user = await ctx.user.assertGetUserById(ctx, agent.agentId);
      return user;
    }
  );
}

export const getSessionContext = singletonFunc(() => new SessionContext());
