import {Document, Model} from 'mongoose';
import {IUser} from '../definitions/user';
import {Schema, Connection} from 'mongoose';
import {getDate} from '../utilities/dateFns';
import {IBaseContext} from '../endpoints/BaseContext';
import {wrapFireAndThrowError} from '../utilities/promiseFns';
import singletonFunc from '../utilities/singletonFunc';
import {IUpdateItemById} from '../utilities/types';
import {ensureTypeFields} from './utils';

const userSchema = ensureTypeFields<IUser>({
    userId: {type: String, unique: true, index: true},
    firstName: {type: String},
    lastName: {type: String},
    email: {type: String, unique: true, index: true, lowercase: true},
    phone: {
        type: String,
        // unique: true,
        index: true,
    },
    hash: {type: String},
    createdAt: {type: Date, default: getDate},
    lastUpdatedAt: {type: Date},
    passwordLastChangedAt: {type: Date},
    isEmailVerified: {type: Boolean},
    emailVerifiedAt: {type: Date},
    emailVerificationCode: {type: String},
    emailVerificationCodeSentAt: {type: Date},
    isPhoneVerified: {type: Boolean},
    phoneVerificationCodeSentAt: {type: Date},
    phoneVerificationSID: {type: String},
    phoneVerifiedAt: {type: Date},
    orgs: {
        type: [
            {
                organizationId: String,
                joinedAt: String,
            },
        ],
    },
});

export interface IUserDocument extends Document, IUser {}

const schema = new Schema<IUserDocument>(userSchema);
const modelName = 'user';
const collectionName = 'users';

export function getUserModel(connection: Connection): Model<IUserDocument> {
    const model = connection.model<IUserDocument>(
        modelName,
        schema,
        collectionName
    );

    return model;
}

export type IUserModel = Model<IUserDocument>;

export interface IUserDbHelpers {
    getUserByEmail: (ctx: IBaseContext, email: string) => Promise<IUser | null>;
    getUserById: (ctx: IBaseContext, userId: string) => Promise<IUser | null>;
    updateUserById: (
        ctx: IBaseContext,
        userId: string,
        data: Partial<IUser>
    ) => Promise<IUser | null>;
    bulkUpdateUsersById: (
        ctx: IBaseContext,
        data: Array<IUpdateItemById<IUser>>
    ) => Promise<void>;
    saveUser: (ctx: IBaseContext, user: IUser) => Promise<IUser>;
    userExists: (ctx: IBaseContext, email: string) => Promise<boolean>;
    getUsersByEmail: (ctx: IBaseContext, email: string[]) => Promise<IUser[]>;
}

export default class UserDbHelpers implements IUserDbHelpers {
    public getUserByEmail = wrapFireAndThrowError(
        (ctx: IBaseContext, email: string) => {
            return ctx.db.user
                .findOne({
                    email,
                })
                .lean()
                .exec();
        }
    );

    public getUserById = wrapFireAndThrowError(
        (ctx: IBaseContext, userId: string) => {
            return ctx.db.user
                .findOne({
                    userId,
                })
                .lean()
                .exec();
        }
    );

    public updateUserById = wrapFireAndThrowError(
        (ctx: IBaseContext, userId: string, data: Partial<IUser>) => {
            return ctx.db.user
                .findOneAndUpdate({userId}, data, {new: true})
                .lean()
                .exec();
        }
    );

    bulkUpdateUsersById = wrapFireAndThrowError(
        async (ctx: IBaseContext, data: Array<IUpdateItemById<IUser>>) => {
            const writes = data.map(item => ({
                updateOne: {
                    filter: {fileId: item.id},
                    update: item.data,
                },
            }));

            await ctx.db.user.bulkWrite(writes);
        }
    );

    public userExists = wrapFireAndThrowError(
        (ctx: IBaseContext, email: string) => {
            return ctx.db.user.exists({email: {$regex: email, $options: 'i'}});
        }
    );

    public saveUser = wrapFireAndThrowError(
        (ctx: IBaseContext, user: IUser) => {
            const userDoc = new ctx.db.user(user);
            return userDoc.save();
        }
    );

    public getUsersByEmail = wrapFireAndThrowError(
        (ctx: IBaseContext, emails: string[]) => {
            return ctx.db.user
                .find({email: {$in: emails}})
                .lean()
                .exec();
        }
    );
}

export const getUserDbHelpers = singletonFunc(() => new UserDbHelpers());
