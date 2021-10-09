import * as jwt from 'jsonwebtoken';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {
  wrapFireAndThrowError,
  wrapFireAndThrowErrorNoAsync,
} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import {ProgramAccessTokenDoesNotExistError} from '../programAccessTokens/errors';
import {CredentialsExpiredError} from '../user/errors';
import {IBaseContext} from './BaseContext';

export const CURRENT_ACCESS_TOKEN_VERSION = 1;

export enum TokenType {
  UserToken = 'user',
  ProgramAccessToken = 'program',
  ClientAssignedToken = 'client',
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

export interface IProgramAccessTokenContext {
  saveToken: (
    ctx: IBaseContext,
    token: IProgramAccessToken
  ) => Promise<IProgramAccessToken>;
  getTokenById: (
    ctx: IBaseContext,
    customId: string
  ) => Promise<IProgramAccessToken | null>;
  assertGetTokenById: (
    ctx: IBaseContext,
    customId: string
  ) => Promise<IProgramAccessToken>;
  updateTokenById: (
    ctx: IBaseContext,
    customId: string,
    data: Partial<IProgramAccessToken>
  ) => Promise<IProgramAccessToken | null>;
  deleteTokenById: (ctx: IBaseContext, tokenId: string) => Promise<void>;
  decodeToken: (
    ctx: IBaseContext,
    token: string
  ) => IBaseTokenData<IGeneralTokenSubject>;
  encodeToken: (ctx: IBaseContext, tokenId: string, expires?: number) => string;
}

export default class ProgramAccessTokenContext
  implements IProgramAccessTokenContext {
  public saveToken = wrapFireAndThrowError(
    async (ctx: IBaseContext, data: IProgramAccessToken) => {
      const token = new ctx.db.programAccessToken(data);
      return token.save();
    }
  );

  public getTokenById = wrapFireAndThrowError(
    (ctx: IBaseContext, customId: string) => {
      return ctx.db.programAccessToken
        .findOne({
          customId,
        })
        .lean()
        .exec();
    }
  );

  public assertGetTokenById = wrapFireAndThrowError(
    async (ctx: IBaseContext, customId: string) => {
      const token = await ctx.programAccessToken.getTokenById(ctx, customId);

      if (!token) {
        throw new ProgramAccessTokenDoesNotExistError();
      }

      return token;
    }
  );

  public updateTokenById = wrapFireAndThrowError(
    (
      ctx: IBaseContext,
      customId: string,
      data: Partial<IProgramAccessToken>
    ) => {
      return ctx.db.programAccessToken
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
      await ctx.db.programAccessToken
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

      if (tokenData.version < CURRENT_ACCESS_TOKEN_VERSION) {
        throw new CredentialsExpiredError();
      }

      return tokenData;
    }
  );

  public encodeToken = wrapFireAndThrowErrorNoAsync(
    (ctx: IBaseContext, tokenId: string, expires?: number) => {
      const payload: Omit<IBaseTokenData, 'iat'> = {
        // aud: audience || [],
        version: CURRENT_ACCESS_TOKEN_VERSION,
        sub: {
          id: tokenId,
          type: TokenType.UserToken,
        },
      };

      if (expires) {
        payload.exp = expires / 1000; // exp is in seconds
      }

      return jwt.sign(payload, ctx.appVariables.jwtSecret);
    }
  );
}

export const getProgramTokenContext = singletonFunc(
  () => new ProgramAccessTokenContext()
);
