import {Connection, Document, Model, Schema} from 'mongoose';
import {IAuthKey} from '../definitions/authKey';
import {IBaseContext} from '../endpoints/BaseContext';
import {AuthKeyDoesNotExistError} from '../endpoints/authKeys/errors';
import {getDate} from '../utilities/dateFns';
import {wrapFireAndThrowError} from '../utilities/promiseFns';
import singletonFunc from '../utilities/singletonFunc';
import {ensureTypeFields} from './utils';

const authKeySchema = ensureTypeFields<IAuthKey>({
    authId: {type: String, unique: true, index: true},
    hash: {type: String, index: true},
    createdBy: {type: String},
    createdAt: {type: Date, default: getDate},
    organizationId: {type: String},
});

export interface IAuthKeyDocument extends Document, IAuthKey {}

const schema = new Schema<IAuthKeyDocument>(authKeySchema);
const modelName = 'authKey';
const collectionName = 'authKeys';

export function getAuthKeyModel(connection: Connection) {
    const model = connection.model<IAuthKeyDocument>(
        modelName,
        schema,
        collectionName
    );

    return model;
}

export type IAuthKeyModel = Model<IAuthKeyDocument>;

export interface IAuthKeyDbHelpers {
    getAuthKeyById: (
        ctx: IBaseContext,
        authKeyId: string
    ) => Promise<IAuthKey | null>;
    assertGetAuthKeyById: (
        ctx: IBaseContext,
        authKeyId: string
    ) => Promise<IAuthKey>;
    assertAuthKeyById: (
        ctx: IBaseContext,
        authKeyId: string
    ) => Promise<boolean>;
    updateAuthKeyById: (
        ctx: IBaseContext,
        authKeyId: string,
        data: Partial<IAuthKey>
    ) => Promise<IAuthKey | null>;
    saveAuthKey: (ctx: IBaseContext, authKey: IAuthKey) => Promise<IAuthKey>;
    deleteAuthKey: (ctx: IBaseContext, authKeyId: string) => Promise<void>;
}

export default class AuthKeyDbHelpers implements IAuthKeyDbHelpers {
    public getAuthKeyById = wrapFireAndThrowError(
        (ctx: IBaseContext, authKeyId: string) => {
            return ctx.db.authKey
                .findOne({
                    authKeyId,
                })
                .lean()
                .exec();
        }
    );

    public assertGetAuthKeyById = wrapFireAndThrowError(
        async (ctx: IBaseContext, authKeyId: string) => {
            const authKey = await ctx.authKey.getAuthKeyById(ctx, authKeyId);

            if (!authKey) {
                throw new AuthKeyDoesNotExistError();
            }

            return authKey;
        }
    );

    public assertAuthKeyById = wrapFireAndThrowError(
        async (ctx: IBaseContext, authKeyId: string) => {
            const exists = await ctx.db.authKey.exists({
                authKeyId,
            });

            if (!exists) {
                throw new AuthKeyDoesNotExistError();
            }

            return exists;
        }
    );

    public updateAuthKeyById = wrapFireAndThrowError(
        (ctx: IBaseContext, authKeyId: string, data: Partial<IAuthKey>) => {
            return ctx.db.authKey
                .findOneAndUpdate({authKeyId}, data, {
                    new: true,
                })
                .lean()
                .exec();
        }
    );

    public deleteAuthKey = wrapFireAndThrowError(
        async (ctx: IBaseContext, authKeyId: string) => {
            await ctx.db.authKey.deleteOne({authKeyId}).exec();
        }
    );

    public saveAuthKey = wrapFireAndThrowError(
        async (ctx: IBaseContext, authKey: IAuthKey) => {
            const authKeyDoc = new ctx.db.authKey(authKey);
            return await authKeyDoc.save();
        }
    );
}

export const getAuthKeyDbHelpers = singletonFunc(() => new AuthKeyDbHelpers());
