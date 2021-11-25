import * as jwt from 'jsonwebtoken';
import {
  IPermissionItem,
  PermissionEntityType,
} from '../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
  SessionAgentType,
} from '../../definitions/system';
import {IUser} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import cast from '../../utilities/fns';
import {
  wrapFireAndThrowError,
  wrapFireAndThrowErrorNoAsync,
} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import ClientAssignedTokenQueries from '../clientAssignedTokens/queries';
import ProgramAccessTokenQueries from '../programAccessTokens/queries';
import RequestData from '../RequestData';
import {
  CredentialsExpiredError,
  InvalidCredentialsError,
  PermissionDeniedError,
} from '../user/errors';
import UserQueries from '../user/UserQueries';
import UserTokenQueries from '../user/UserTokenQueries';
import {IBaseContext} from './BaseContext';
import {
  DataProviderFilterValueOperator,
  IDataProviderFilter,
} from './DataProvider';
import DataProviderFilterBuilder from './DataProviderFilterBuilder';

// TODO: when retrieving cached tokens, check that the token contains
// the input JWTEndpoints

export const CURRENT_TOKEN_VERSION = 1;

export enum TokenType {
  UserToken = 'user',
  ProgramAccessToken = 'program',
  ClientAssignedToken = 'client',
}

export enum TokenAudience {
  Login = 'login',
  ChangePassword = 'change-password',
  ConfirmEmailAddress = 'confirm-email-address',
}

export interface IGeneralTokenSubject {
  id: string;
  type: TokenType;
}

export interface IBaseTokenData<
  Sub extends IGeneralTokenSubject = IGeneralTokenSubject
> {
  version: number;
  sub: Sub;
  iat: number;
  // aud: string[];
  exp?: number;
}

export interface IAgentPersistedToken {
  audience: TokenAudience[];
}

export interface ISessionContext {
  getAgent: (
    ctx: IBaseContext,
    data: RequestData,
    permittedAgentTypes?: SessionAgentType[],
    audience?: TokenAudience | TokenAudience[]
  ) => Promise<ISessionAgent>;
  getUser: (
    ctx: IBaseContext,
    data: RequestData,
    audience?: TokenAudience | TokenAudience[]
  ) => Promise<IUser>;
  isAgentAuthorized: (
    ctx: IBaseContext,
    agent: ISessionAgent,
    resourceId: string,
    resourceType: AppResourceType,
    action: BasicCRUDActions,
    noThrow?: boolean
  ) => Promise<boolean>;
  decodeToken: (
    ctx: IBaseContext,
    token: string
  ) => IBaseTokenData<IGeneralTokenSubject>;
  tokenContainsAudience: (
    ctx: IBaseContext,
    tokenData: IUserToken,
    expectedAudience: TokenAudience | TokenAudience[]
  ) => boolean;
  encodeToken: (
    ctx: IBaseContext,
    tokenId: string,
    tokenType: TokenType,
    expires?: number
  ) => string;
}

export default class SessionContext implements ISessionContext {
  getAgent = wrapFireAndThrowError(
    async (
      ctx: IBaseContext,
      data: RequestData,
      permittedAgentTypes?: SessionAgentType[],
      audience?: TokenAudience | TokenAudience[]
    ) => {
      if (data.agent) {
        return data.agent;
      }

      let userToken = data.userToken;
      let clientAssignedToken = data.clientAssignedToken;
      let programAccessToken = data.programAccessToken;
      const incomingTokenData = data.incomingTokenData;
      const noProcessedToken =
        !userToken && !clientAssignedToken && !programAccessToken;

      if (noProcessedToken) {
        if (!incomingTokenData) {
          throw new PermissionDeniedError();
        }

        switch (incomingTokenData.sub.type) {
          case TokenType.UserToken: {
            userToken = await ctx.data.userToken.assertGetItem(
              UserTokenQueries.getById(incomingTokenData.sub.id)
            );
            data.userToken = userToken;

            if (audience) {
              ctx.session.tokenContainsAudience(ctx, userToken, audience);
            }

            break;
          }

          case TokenType.ProgramAccessToken: {
            programAccessToken = await ctx.data.programAccessToken.assertGetItem(
              ProgramAccessTokenQueries.getById(incomingTokenData.sub.id)
            );
            data.programAccessToken = programAccessToken;
            break;
          }

          case TokenType.ClientAssignedToken: {
            clientAssignedToken = await ctx.data.clientAssignedToken.assertGetItem(
              ClientAssignedTokenQueries.getById(incomingTokenData.sub.id)
            );
            data.clientAssignedToken = clientAssignedToken;
            break;
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

      // Throw error, control should not get here
      throw new InvalidCredentialsError();
    }
  );

  getUser = wrapFireAndThrowError(
    async (
      ctx: IBaseContext,
      data: RequestData,
      audience?: TokenAudience | TokenAudience[]
    ) => {
      const agent = await ctx.session.getAgent(
        ctx,
        data,
        [SessionAgentType.User],
        audience
      );

      const user = await ctx.data.user.assertGetItem(
        UserQueries.getById(agent.agentId)
      );

      return user;
    }
  );

  isAgentAuthorized = wrapFireAndThrowError(
    async (
      ctx: IBaseContext,
      agent: ISessionAgent,
      resourceId: string,
      resourceType: AppResourceType,
      action: BasicCRUDActions,
      noThrow?: boolean
    ) => {
      function newFilter() {
        return new DataProviderFilterBuilder<IPermissionItem>();
      }

      async function performQueryAndCheck(
        query: IDataProviderFilter<IPermissionItem>
      ) {
        const items = await ctx.data.permissionItem.getManyItems(query);

        for (const item of items) {
          if (item.isExclusion) {
            return false;
          }
        }

        return items.length > 0;
      }

      async function checkByOwner(
        permissionEntityId: string,
        permissionEntityType: PermissionEntityType
      ) {
        const query = newFilter()
          .addItem(
            'permissionOwnerId',
            resourceId,
            DataProviderFilterValueOperator.Equal
          )
          .addItem(
            'permissionOwnerType',
            resourceType,
            DataProviderFilterValueOperator.Equal
          )
          .addItem(
            'permissionEntityId',
            permissionEntityId,
            DataProviderFilterValueOperator.Equal
          )
          .addItem(
            'permissionEntityType',
            permissionEntityType,
            DataProviderFilterValueOperator.Equal
          )
          .addItem(
            'action',
            [action, BasicCRUDActions.All],
            DataProviderFilterValueOperator.In
          )
          .addItem(
            'isForPermissionOwnerOnly',
            true,
            DataProviderFilterValueOperator.Equal
          )
          .build();

        return performQueryAndCheck(query);
      }

      async function checkByEntity(
        permissionEntityId: string,
        permissionEntityType: PermissionEntityType
      ) {
        const query = newFilter()
          .addItem(
            'permissionEntityId',
            permissionEntityId,
            DataProviderFilterValueOperator.Equal
          )
          .addItem(
            'permissionEntityType',
            permissionEntityType,
            DataProviderFilterValueOperator.Equal
          )
          .addItem(
            'resourceType',
            resourceType,
            DataProviderFilterValueOperator.Equal
          )
          .addItem(
            'action',
            [action, BasicCRUDActions.All],
            DataProviderFilterValueOperator.In
          )
          .build();

        const items = await ctx.data.permissionItem.getManyItems(query);
      }

      function mergeResults(results: boolean[]) {
        return results.reduce(
          (accumulator, next) => accumulator || next,
          false
        );
      }
    }
  );

  decodeToken = wrapFireAndThrowErrorNoAsync(
    (ctx: IBaseContext, token: string) => {
      const tokenData = jwt.verify(
        token,
        ctx.appVariables.jwtSecret
      ) as IBaseTokenData<IGeneralTokenSubject>;

      if (tokenData.version < CURRENT_TOKEN_VERSION) {
        throw new CredentialsExpiredError();
      }

      return tokenData;
    }
  );

  tokenContainsAudience = wrapFireAndThrowErrorNoAsync(
    (
      ctx: IBaseContext,
      tokenData: IUserToken,
      expectedAudience: TokenAudience | TokenAudience[]
    ) => {
      const audience = cast<TokenAudience[]>(tokenData.audience);
      const hasAudience = !!audience.find(nextAud =>
        expectedAudience.includes(nextAud)
      );

      return hasAudience;
    }
  );

  encodeToken = wrapFireAndThrowErrorNoAsync(
    (
      ctx: IBaseContext,
      tokenId: string,
      tokenType: TokenType,
      expires?: number
    ) => {
      const payload: Omit<IBaseTokenData, 'iat'> = {
        version: CURRENT_TOKEN_VERSION,
        sub: {
          id: tokenId,
          type: tokenType,
        },
      };

      if (expires) {
        payload.exp = expires / 1000; // exp is in seconds
      }

      return jwt.sign(payload, ctx.appVariables.jwtSecret);
    }
  );
}

export const getSessionContext = singletonFunc(() => new SessionContext());
