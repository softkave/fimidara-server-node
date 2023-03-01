import * as jwt from 'jsonwebtoken';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  IBaseTokenData,
  ISessionAgent,
  ITokenSubjectDefault,
  PUBLIC_SESSION_AGENT,
  TokenFor,
} from '../../definitions/system';
import {IUser} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import {appAssert} from '../../utils/assertion';
import {dateToSeconds} from '../../utils/dateFns';
import {ServerError} from '../../utils/errors';
import {cast, toArray} from '../../utils/fns';
import {getResourceTypeFromId} from '../../utils/resourceId';
import {reuseableErrors} from '../../utils/reusableErrors';
import {
  makeClientAssignedTokenAgent,
  makeProgramAccessTokenAgent,
  makeUserSessionAgent,
} from '../../utils/sessionUtils';
import RequestData from '../RequestData';
import {
  CredentialsExpiredError,
  InvalidCredentialsError,
  PermissionDeniedError,
} from '../user/errors';
import {IBaseContext} from './types';

export interface ISessionContext {
  getAgent: (
    ctx: IBaseContext,
    data: RequestData,
    permittedAgentTypes?: AppResourceType | AppResourceType[],
    audience?: TokenFor | TokenFor[]
  ) => Promise<ISessionAgent>;
  getUser: (
    ctx: IBaseContext,
    data: RequestData,
    audience?: TokenFor | TokenFor[]
  ) => Promise<IUser>;
  decodeToken: (ctx: IBaseContext, token: string) => IBaseTokenData<ITokenSubjectDefault>;
  tokenContainsAudience: (
    ctx: IBaseContext,
    tokenData: IUserToken,
    expectedAudience: TokenFor | TokenFor[]
  ) => boolean;
  encodeToken: (
    ctx: IBaseContext,
    tokenId: string,
    expires?: string | Date | number | null,
    issuedAt?: string | Date | number | null
  ) => string;
}

export default class SessionContext implements ISessionContext {
  getAgent = async (
    ctx: IBaseContext,
    data: RequestData,
    permittedAgentTypes: AppResourceType | AppResourceType[] = [
      AppResourceType.User,
      AppResourceType.ClientAssignedToken,
      AppResourceType.ProgramAccessToken,
    ],
    audience: TokenFor | TokenFor[] = TokenFor.Login
  ) => {
    if (data.agent) {
      return data.agent;
    }

    let userToken: IUserToken | null = null,
      user: IUser | null = null,
      clientAssignedToken: IClientAssignedToken | null = null,
      programAccessToken: IProgramAccessToken | null = null;
    const incomingTokenData = data.incomingTokenData;
    appAssert(incomingTokenData, new PermissionDeniedError());
    const tokenType = getResourceTypeFromId(incomingTokenData.sub.id);

    switch (tokenType) {
      case AppResourceType.UserToken: {
        userToken = await ctx.semantic.userToken.getOneById(incomingTokenData.sub.id);
        appAssert(userToken, new InvalidCredentialsError());
        if (audience) {
          ctx.session.tokenContainsAudience(ctx, userToken, audience);
        }

        user = await ctx.semantic.user.getOneById(userToken.userId);
        appAssert(user, reuseableErrors.user.notFound());
        break;
      }

      case AppResourceType.ProgramAccessToken: {
        const programToken = await ctx.semantic.programAccessToken.getOneById(
          incomingTokenData.sub.id
        );
        appAssert(programToken, new InvalidCredentialsError());
        break;
      }

      case AppResourceType.ClientAssignedToken: {
        const clientToken = await ctx.semantic.clientAssignedToken.getOneById(
          incomingTokenData.sub.id
        );
        appAssert(clientToken, new InvalidCredentialsError());
        break;
      }
    }

    if (permittedAgentTypes?.length) {
      const permittedAgent = toArray(permittedAgentTypes).find(type => {
        switch (type) {
          case AppResourceType.User:
            return !!userToken;
          case AppResourceType.ProgramAccessToken:
            return !!programAccessToken;
          case AppResourceType.ClientAssignedToken:
            return !!clientAssignedToken;
          case AppResourceType.Public:
            return true;
          default:
            return false;
        }
      });

      if (!permittedAgent) {
        throw new PermissionDeniedError();
      }
    }

    if (userToken) {
      appAssert(user, new ServerError());
      return (data.agent = makeUserSessionAgent(user, userToken));
    } else if (programAccessToken) {
      return (data.agent = makeProgramAccessTokenAgent(programAccessToken));
    } else if (clientAssignedToken) {
      return (data.agent = makeClientAssignedTokenAgent(clientAssignedToken));
    }

    return PUBLIC_SESSION_AGENT;
  };

  getUser = async (ctx: IBaseContext, data: RequestData, audience?: TokenFor | TokenFor[]) => {
    const agent = await ctx.session.getAgent(ctx, data, [AppResourceType.User], audience);
    appAssert(agent.user, new ServerError());
    return agent.user;
  };

  decodeToken = (ctx: IBaseContext, token: string) => {
    const tokenData = cast<IBaseTokenData<ITokenSubjectDefault>>(
      jwt.verify(token, ctx.appVariables.jwtSecret, {
        complete: false,
      })
    );

    if (tokenData.version < CURRENT_TOKEN_VERSION) {
      throw new CredentialsExpiredError();
    }

    return tokenData;
  };

  tokenContainsAudience = (
    ctx: IBaseContext,
    tokenData: IUserToken,
    expectedAudience: TokenFor | TokenFor[]
  ) => {
    const audience = cast<TokenFor[]>(tokenData.tokenFor);
    const hasAudience = !!audience.find(nextAud => expectedAudience.includes(nextAud));
    return hasAudience;
  };

  encodeToken = (
    ctx: IBaseContext,
    tokenId: string,
    expires?: string | Date | number | null,
    issuedAt?: string | Date | number | null
  ) => {
    const payload: Omit<IBaseTokenData, 'iat'> & {iat?: number} = {
      version: CURRENT_TOKEN_VERSION,
      sub: {id: tokenId},
    };

    const msInSec = 1000;
    if (expires) {
      payload.exp = dateToSeconds(expires);
    }
    if (issuedAt) {
      payload.iat = dateToSeconds(issuedAt);
    }

    return jwt.sign(payload, ctx.appVariables.jwtSecret);
  };
}
