import {merge} from 'lodash';
import {IBaseContext} from './BaseContext';
import {isAfter} from 'date-fns';
import {IUser} from '../definitions/user';
import {resolveJWTError} from '../middlewares/handleErrors';
import {wrapFireAndThrowError} from '../utilities/promiseFns';
import AccessToken, {IBaseUserTokenData} from './AccessToken';
import RequestData from './RequestData';
import {JWTEndpoints} from './types';
import singletonFunc from '../utilities/singletonFunc';
import {
    PermissionDeniedError,
    UserDoesNotExistError,
    InvalidCredentialsError,
    LoginAgainError,
} from './account/errors';

// TODO: how can we validate user signin before getting to the endpoints that require user signin
// for security purposes, in case we forgets to check in the endpoint

export interface IEndpointSession {
    addUserToSession: (
        ctx: IBaseContext,
        data: RequestData,
        user: IUser
    ) => void;
    getUser: (ctx: IBaseContext, data: RequestData) => Promise<IUser>;
    // eslint-disable-next-line @typescript-eslint/ban-types
    getRequestTokenData: <T extends object = IBaseUserTokenData>(
        ctx: IBaseContext,
        data: RequestData<any, T>
    ) => T;
    // eslint-disable-next-line @typescript-eslint/ban-types
    tryGetRequestTokenData: <T extends object = IBaseUserTokenData>(
        ctx: IBaseContext,
        data: RequestData<any, T>
    ) => T | undefined | null;
    updateUser: (
        ctx: IBaseContext,
        data: RequestData,
        partialUserData: Partial<IUser>
    ) => Promise<IUser | null>;
    assertUser: (ctx: IBaseContext, data: RequestData) => Promise<boolean>;
    validateUserTokenData: (
        ctx: IBaseContext,
        tokenData: IBaseUserTokenData,
        required?: boolean,
        audience?: JWTEndpoints
    ) => Promise<IUser | null>;
    validateUserToken: (ctx: IBaseContext, token: string) => IBaseUserTokenData;
    tryGetUser: (ctx: IBaseContext, data: RequestData) => Promise<IUser | null>;
    clearCachedUserData: (ctx: IBaseContext, data: RequestData) => void;
}

export default class SessionContext implements IEndpointSession {
    private static async __getUser(
        ctx: IBaseContext,
        data: RequestData,
        required = true
    ): Promise<IUser | null> {
        // TODO: not using cached data on multiple requests
        if (data.req.appUserData) {
            return data.req.appUserData;
        }

        if (!data.req.user) {
            if (required) {
                throw new PermissionDeniedError();
            } else {
                return null;
            }
        }

        const user = await ctx.session.validateUserTokenData(
            ctx,
            data.req.user,
            required,
            JWTEndpoints.Login
        );

        // TODO:
        // Caching the user data when we have multi-tenancy can be problematic
        // cause the user may have been updated before a string of requests are complete
        data.req.appUserData = user;
        return user;
    }

    public updateUser = wrapFireAndThrowError(
        async (
            ctx: IBaseContext,
            data: RequestData,
            update: Partial<IUser>
        ) => {
            const user = await this.getUser(ctx, data);

            // TODO: is this safe, and does it work?
            merge(user, update);

            const updatedUser = await ctx.db.user
                .findOneAndUpdate({userId: user?.userId}, update, {
                    new: true,
                })
                .lean()
                .exec();

            if (!updatedUser) {
                throw new UserDoesNotExistError();
            }

            return updatedUser;
        }
    );

    public clearCachedUserData(ctx: IBaseContext, data: RequestData) {
        if (data.req) {
            delete data.req.appUserData;
        }
    }

    public validateUserToken(ctx: IBaseContext, token: string) {
        try {
            const tokenData = AccessToken.decodeToken(token);
            return tokenData;
        } catch (error) {
            console.error(error);
            const JWTError = resolveJWTError(error);

            if (JWTError) {
                throw JWTError;
            }

            throw new PermissionDeniedError();
        }
    }

    public async validateUserTokenData(
        ctx: IBaseContext,
        tokenData: IBaseUserTokenData,
        required = true,
        audience = JWTEndpoints.Login
    ) {
        if (!tokenData || !AccessToken.containsAudience(tokenData, audience)) {
            if (required) {
                throw new InvalidCredentialsError();
            } else {
                return null;
            }
        }

        const user = await ctx.db.user
            .findOne({
                userId: tokenData.sub.userId,
            })
            .exec();

        if (!user) {
            throw new UserDoesNotExistError();
        }

        const userPasswordLastChangedAt = user.passwordLastChangedAt;
        const tokenPasswordLastChangedAt = AccessToken.getPasswordLastChangedAt(
            tokenData
        );

        // validate password changes to logout user if using old password or old token format
        if (
            !userPasswordLastChangedAt ||
            !tokenPasswordLastChangedAt ||
            isAfter(
                new Date(userPasswordLastChangedAt),
                new Date(tokenPasswordLastChangedAt)
            )
        ) {
            throw new LoginAgainError();
        }

        return user;
    }

    public addUserToSession(ctx: IBaseContext, data: RequestData, user: IUser) {
        data.req.appUserData = user;
    }

    public async getUser(ctx: IBaseContext, data: RequestData) {
        return (await SessionContext.__getUser(ctx, data)) as IUser;
    }

    public async assertUser(ctx: IBaseContext, data: RequestData) {
        return !!(await SessionContext.__getUser(ctx, data));
    }

    public async tryGetUser(ctx: IBaseContext, data: RequestData) {
        return SessionContext.__getUser(ctx, data, false);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    public getRequestTokenData = <T extends object = IBaseUserTokenData>(
        ctx: IBaseContext,
        data: RequestData<any, T>
    ) => {
        const tokenData = data.tokenData;

        if (!tokenData) {
            throw new InvalidCredentialsError();
        }

        return tokenData;
    };

    // eslint-disable-next-line @typescript-eslint/ban-types
    public tryGetRequestTokenData = <T extends object = IBaseUserTokenData>(
        ctx: IBaseContext,
        data: RequestData<any, T>
    ) => {
        const tokenData = data.tokenData;
        return tokenData;
    };
}

export const getSessionContext = singletonFunc(() => new SessionContext());
