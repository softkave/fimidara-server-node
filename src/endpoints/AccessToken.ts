import * as jwt from 'jsonwebtoken';
import {IUser} from '../definitions/user';
import {appVariables} from '../resources/appVariables';
import {indexArray} from '../utilities/indexArray';
import {LoginAgainError} from './account/errors';
import {JWTEndpoints} from './types';

export const kUserTokenVersion = 1;

export interface IUserTokenSubject {
    userId: string;
    padL?: string; // passwordLastChangedAt
}

export interface IBaseTokenData<Sub extends Record<string, any>> {
    version: number;
    sub: Sub;
    iat: number;
    aud: string[];
    exp?: number;
}

export type IBaseUserTokenData = IBaseTokenData<IUserTokenSubject>;

export interface INewUserTokenParams {
    user: IUser;
    audience: JWTEndpoints[];
    clientId?: string;
    additionalData?: any;
    expires?: number;
}

export default class AccessToken {
    public static newUserTokenData(
        p: INewUserTokenParams
    ): Omit<IBaseUserTokenData, 'iat'> {
        const subject: IUserTokenSubject = {
            userId: p.user.userId,
            padL: p.user.passwordLastChangedAt,
            clientId: p.clientId,
            ...p.additionalData,
        };

        const payload: Omit<IBaseUserTokenData, 'iat'> = {
            sub: subject,
            aud: p.audience || [],
            version: kUserTokenVersion,
        };

        if (p.expires) {
            payload.exp = p.expires / 1000; // exp is in seconds
        }

        return payload;
    }

    public static newUserToken(p: INewUserTokenParams): string {
        const payload = AccessToken.newUserTokenData(p);
        return jwt.sign(payload, appVariables.jwtSecret);
    }

    public static decodeToken<T extends IBaseUserTokenData>(token: string): T {
        const tokenData = jwt.verify(token, appVariables.jwtSecret) as T;
        AccessToken.checkVersion(tokenData);
        return tokenData;
    }

    public static containsAudience(
        tokenData: IBaseUserTokenData,
        aud: JWTEndpoints | JWTEndpoints[]
    ): boolean {
        AccessToken.checkVersion(tokenData);
        const audience = tokenData.aud;
        const inputdAudMap: Record<string, string> = indexArray(
            Array.isArray(aud) ? aud : [aud]
        );

        const hasAudience = !!audience.find(
            nextAud =>
                nextAud === JWTEndpoints.Global || !!inputdAudMap[nextAud]
        );

        return hasAudience;
    }

    public static checkVersion(tokenData: IBaseTokenData<any>): boolean {
        if (!tokenData.version || tokenData.version !== kUserTokenVersion) {
            throw new LoginAgainError();
        }

        return true;
    }

    public static getPasswordLastChangedAt(
        tokenData: IBaseUserTokenData
    ): string | undefined {
        return tokenData.sub.padL;
    }
}
