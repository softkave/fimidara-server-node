import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {ISessionAgent, SessionAgentType} from '../../definitions/system';
import {IUser} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import {InvalidRequestError} from '../errors';
import RequestData from '../RequestData';
import {IBaseContext} from './BaseContext';
import {IBaseTokenData} from './ProgramAccessTokenContext';
import {JWTEndpoint} from './UserTokenContext';

// TODO: when retrieving cached tokens, check that the token contains
// the input JWTEndpoints

export interface ISessionContext {
    getIncomingTokenData: (
        ctx: IBaseContext,
        data: RequestData
    ) => IBaseTokenData;
    getUserTokenData: (
        ctx: IBaseContext,
        data: RequestData,
        audience?: JWTEndpoint | JWTEndpoint[]
    ) => Promise<IUserToken>;
    getProgramAccessTokenData: (
        ctx: IBaseContext,
        data: RequestData
    ) => Promise<IProgramAccessToken>;
    getClientAssignedTokenData: (
        ctx: IBaseContext,
        data: RequestData
    ) => Promise<IClientAssignedToken>;
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
    getProgramAccessToken: (
        ctx: IBaseContext,
        data: RequestData
    ) => Promise<IProgramAccessToken>;
    getClientAssignedToken: (
        ctx: IBaseContext,
        data: RequestData
    ) => Promise<IClientAssignedToken>;
    tryGetAgent: (
        ctx: IBaseContext,
        data: RequestData,
        permittedAgentTypes?: SessionAgentType[],
        audience?: JWTEndpoint | JWTEndpoint[]
    ) => Promise<IUser | null>;
    tryGetUserTokenData: (
        ctx: IBaseContext,
        data: RequestData,
        audience?: JWTEndpoint | JWTEndpoint[]
    ) => Promise<IUserToken | null>;
    assertAgent: (
        ctx: IBaseContext,
        data: RequestData,
        permittedAgentTypes?: SessionAgentType[],
        audience?: JWTEndpoint | JWTEndpoint[]
    ) => Promise<boolean>;
    assertUser: (
        ctx: IBaseContext,
        data: RequestData,
        audience?: JWTEndpoint | JWTEndpoint[]
    ) => Promise<boolean>;
}

export default class SessionContext implements ISessionContext {
    public getIncomingTokenData = wrapFireAndThrowError(
        (ctx: IBaseContext, data: RequestData) => {
            if (data.incomingTokenData) {
                return data.incomingTokenData;
            }

            let incomingTokenData: IBaseTokenData | null = null;

            if (data.req) {
                incomingTokenData = data.req.user;
            } else if (data.incomingSocketData) {
                const tokenString = data.incomingSocketData.token;
                incomingTokenData = ctx.token.decodeToken(ctx, tokenString);
            }

            if (!incomingTokenData) {
                throw new InvalidRequestError();
            }

            data.incomingTokenData = incomingTokenData;
            return incomingTokenData;
        }
    );

    public getTokenData = wrapFireAndThrowError(
        async (
            ctx: IBaseContext,
            data: RequestData,
            audience?: JWTEndpoint
        ) => {
            if (data.tokenData) {
                return data.tokenData;
            }

            const incomingTokenData = await ctx.session.getIncomingTokenData(
                ctx,
                data
            );

            const tokenData = await ctx.token.assertGetTokenById(
                ctx,
                incomingTokenData.sub.id
            );

            if (audience) {
                ctx.token.containsAudience(ctx, tokenData, audience);
            }

            data.tokenData = tokenData;
            return tokenData;
        }
    );

    public tryGetTokenData = wrapFireAndThrowError(
        async (
            ctx: IBaseContext,
            data: RequestData,
            audience?: JWTEndpoint
        ) => {
            return await tryCatch(() =>
                ctx.session.getTokenData(ctx, data, audience)
            );
        }
    );

    public tryGetUser = wrapFireAndThrowError(
        async (
            ctx: IBaseContext,
            data: RequestData,
            audience?: JWTEndpoint
        ) => {
            return await tryCatch(() =>
                ctx.session.getUser(ctx, data, audience)
            );
        }
    );

    public getUser = wrapFireAndThrowError(
        async (
            ctx: IBaseContext,
            data: RequestData,
            audience?: JWTEndpoint
        ) => {
            if (data.user) {
                return data.user;
            }

            const tokenData = await ctx.session.getTokenData(
                ctx,
                data,
                audience
            );

            // await ctx.session.getClient(ctx, data);
            const user = await ctx.user.assertGetUserById(
                ctx,
                tokenData.userId
            );

            data.user = user;
            return user;
        }
    );

    public assertUser = wrapFireAndThrowError(
        async (
            ctx: IBaseContext,
            data: RequestData,
            audience?: JWTEndpoint
        ) => {
            return !!(await ctx.session.getUser(ctx, data, audience));
        }
    );

    public assertClient = wrapFireAndThrowError(
        async (ctx: IBaseContext, data: RequestData) => {
            return !!(await ctx.session.getClient(ctx, data));
        }
    );
}

export const getSessionContext = makeSingletonFunc(() => new SessionContext());
