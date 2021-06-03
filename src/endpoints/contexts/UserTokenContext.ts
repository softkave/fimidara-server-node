import * as jwt from 'jsonwebtoken';
import {IUserToken} from '../../definitions/userToken';
import {
    wrapFireAndThrowError,
    wrapFireAndThrowErrorNoAsync,
} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import {CredentialsExpiredError, InvalidCredentialsError} from '../user/errors';
import {IBaseContext} from './BaseContext';
import {
    IBaseTokenData,
    IGeneralTokenSubject,
} from './ProgramAccessTokenContext';

export const CURRENT_USER_TOKEN_VERSION = 1;

export enum JWTEndpoint {
    Login = 'login',
    ChangePassword = 'changePassword',
}

export interface IUserTokenContext {
    saveToken: (ctx: IBaseContext, token: IUserToken) => Promise<IUserToken>;
    getTokenById: (
        ctx: IBaseContext,
        customId: string
    ) => Promise<IUserToken | null>;
    assertGetTokenById: (
        ctx: IBaseContext,
        customId: string
    ) => Promise<IUserToken>;
    updateTokenById: (
        ctx: IBaseContext,
        customId: string,
        data: Partial<IUserToken>
    ) => Promise<IUserToken | null>;
    deleteTokenById: (ctx: IBaseContext, tokenId: string) => Promise<void>;
    decodeToken: (
        ctx: IBaseContext,
        token: string
    ) => IBaseTokenData<IGeneralTokenSubject>;
    containsAudience: (
        ctx: IBaseContext,
        tokenData: IUserToken,
        inputAud: JWTEndpoint
    ) => boolean;
    encodeToken: (
        ctx: IBaseContext,
        tokenId: string,
        expires?: number
    ) => string;
}

export default class UserTokenContext implements IUserTokenContext {
    public saveToken = wrapFireAndThrowError(
        async (ctx: IBaseContext, data: IUserToken) => {
            const token = new ctx.db.userToken(data);
            return token.save();
        }
    );

    public getTokenById = wrapFireAndThrowError(
        (ctx: IBaseContext, customId: string) => {
            return ctx.db.userToken
                .findOne({
                    customId,
                })
                .lean()
                .exec();
        }
    );

    public getTokenByUserAndClientId = wrapFireAndThrowError(
        (ctx: IBaseContext, userId: string, clientId: string) => {
            return ctx.db.userToken
                .findOne({
                    userId,
                    clientId,
                })
                .lean()
                .exec();
        }
    );

    public assertGetTokenById = wrapFireAndThrowError(
        async (ctx: IBaseContext, customId: string) => {
            const token = await ctx.userToken.getTokenById(ctx, customId);

            if (!token) {
                throw new InvalidCredentialsError();
            }

            return token;
        }
    );

    public updateTokenById = wrapFireAndThrowError(
        (ctx: IBaseContext, customId: string, data: Partial<IUserToken>) => {
            return ctx.db.userToken
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

    public deleteTokenByUserAndClientId = wrapFireAndThrowError(
        async (ctx: IBaseContext, clientId: string, userId: string) => {
            await ctx.db.userToken
                .deleteOne({
                    clientId,
                    userId,
                })
                .exec();
        }
    );

    public deleteTokenById = wrapFireAndThrowError(
        async (ctx: IBaseContext, tokenId: string) => {
            await ctx.db.userToken
                .deleteOne({
                    customId: tokenId,
                })
                .exec();
        }
    );

    public deleteTokensByUserId = wrapFireAndThrowError(
        async (ctx: IBaseContext, userId: string) => {
            await ctx.db.userToken
                .deleteMany({
                    userId,
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

            if (tokenData.version < CURRENT_USER_TOKEN_VERSION) {
                throw new CredentialsExpiredError();
            }

            return tokenData;
        }
    );

    public containsAudience = wrapFireAndThrowErrorNoAsync(
        (ctx: IBaseContext, tokenData: IUserToken, inputAud: JWTEndpoint) => {
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
                version: CURRENT_USER_TOKEN_VERSION,
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

export const getUserTokenContext = singletonFunc(() => new UserTokenContext());
