import {IBaseContext} from './BaseContext';
import * as jwt from 'jsonwebtoken';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {
    wrapFireAndThrowError,
    wrapFireAndThrowErrorNoAsync,
} from '../../utilities/promiseFns';
import {CredentialsExpiredError, InvalidCredentialsError} from '../user/errors';
import {
    IBaseTokenData,
    IGeneralTokenSubject,
} from './ProgramAccessTokenContext';
import {JWTEndpoint} from './UserTokenContext';
import singletonFunc from '../../utilities/singletonFunc';

export const CURRENT_CLIENT_ASSIGNED_TOKEN_VERSION = 1;

export interface IClientAssignedTokenContext {
    saveToken: (
        ctx: IBaseContext,
        token: IClientAssignedToken
    ) => Promise<IClientAssignedToken>;
    getTokenById: (
        ctx: IBaseContext,
        customId: string
    ) => Promise<IClientAssignedToken | null>;
    assertGetTokenById: (
        ctx: IBaseContext,
        customId: string
    ) => Promise<IClientAssignedToken>;
    updateTokenById: (
        ctx: IBaseContext,
        customId: string,
        data: Partial<IClientAssignedToken>
    ) => Promise<IClientAssignedToken | null>;
    deleteTokenById: (ctx: IBaseContext, tokenId: string) => Promise<void>;
    decodeToken: (
        ctx: IBaseContext,
        token: string
    ) => IBaseTokenData<IGeneralTokenSubject>;
    encodeToken: (
        ctx: IBaseContext,
        tokenId: string,
        expires?: number
    ) => string;
}

export default class ClientAssignedTokenContext
    implements IClientAssignedTokenContext {
    public saveToken = wrapFireAndThrowError(
        async (ctx: IBaseContext, data: IClientAssignedToken) => {
            const token = new ctx.db.clientAssignedToken(data);
            return token.save();
        }
    );

    public getTokenById = wrapFireAndThrowError(
        (ctx: IBaseContext, customId: string) => {
            return ctx.db.clientAssignedToken
                .findOne({
                    customId,
                })
                .lean()
                .exec();
        }
    );

    public assertGetTokenById = wrapFireAndThrowError(
        async (ctx: IBaseContext, customId: string) => {
            const token = await ctx.clientAssignedToken.getTokenById(
                ctx,
                customId
            );

            if (!token) {
                throw new InvalidCredentialsError();
            }

            return token;
        }
    );

    public updateTokenById = wrapFireAndThrowError(
        (
            ctx: IBaseContext,
            customId: string,
            data: Partial<IClientAssignedToken>
        ) => {
            return ctx.db.clientAssignedToken
                .findOneAndUpdate(
                    {
                        customId,
                    },
                    data,
                    {new: true}
                )
                .lean()
                .exec();
        }
    );

    public deleteTokenById = wrapFireAndThrowError(
        async (ctx: IBaseContext, tokenId: string) => {
            await ctx.db.clientAssignedToken
                .deleteOne({
                    customId: tokenId,
                })
                .exec();
        }
    );

    public decodeToken = wrapFireAndThrowErrorNoAsync(
        (ctx: IBaseContext, token: string) => {
            const tokenData = jwt.verify(
                token,
                ctx.appVariables.jwtSecret
            ) as IBaseTokenData<IGeneralTokenSubject>;

            if (tokenData.version < CURRENT_CLIENT_ASSIGNED_TOKEN_VERSION) {
                throw new CredentialsExpiredError();
            }

            return tokenData;
        }
    );

    public containsAudience = wrapFireAndThrowError(
        (
            ctx: IBaseContext,
            tokenData: IClientAssignedToken,
            inputAud: JWTEndpoint
        ) => {
            const audience = tokenData.audience;
            const hasAudience = !!audience.find(
                nextAud => nextAud === inputAud
            );

            return hasAudience;
        }
    );

    public encodeToken = wrapFireAndThrowErrorNoAsync(
        (ctx: IBaseContext, tokenId: string, expires?: number) => {
            const payload: Omit<IBaseTokenData, 'iat'> = {
                // aud: audience || [],
                version: CURRENT_CLIENT_ASSIGNED_TOKEN_VERSION,
                sub: {
                    id: tokenId,
                },
            };

            if (expires) {
                payload.exp = expires / 1000; // exp is in seconds
            }

            return jwt.sign(payload, ctx.appVariables.jwtSecret);
        }
    );
}

export const getClientAssignedTokenContext = singletonFunc(
    () => new ClientAssignedTokenContext()
);
