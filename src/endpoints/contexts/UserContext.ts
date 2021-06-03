import {IUser} from '../../definitions/user';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import {IUpdateItemById} from '../../utilities/types';
import {IBaseContext} from './BaseContext';

export interface IUserContext {
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

export default class UserContext implements IUserContext {
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

export const getUserContext = singletonFunc(() => new UserContext());
