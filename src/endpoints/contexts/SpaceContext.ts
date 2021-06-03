import {ISpace} from '../../definitions/space';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import {SpaceDoesNotExistError} from '../spaces/errors';
import {IBaseContext} from './BaseContext';

export interface ISpaceContext {
    getSpaceById: (
        ctx: IBaseContext,
        spaceId: string
    ) => Promise<ISpace | null>;
    getSpacesByIds: (
        ctx: IBaseContext,
        spaceIds: string[]
    ) => Promise<ISpace[]>;
    assertGetSpaceById: (ctx: IBaseContext, spaceId: string) => Promise<ISpace>;
    assertSpaceById: (ctx: IBaseContext, spaceId: string) => Promise<boolean>;
    updateSpaceById: (
        ctx: IBaseContext,
        spaceId: string,
        data: Partial<ISpace>
    ) => Promise<ISpace | null>;
    saveSpace: (ctx: IBaseContext, space: ISpace) => Promise<ISpace>;
    deleteSpace: (ctx: IBaseContext, spaceId: string) => Promise<void>;
    spaceExists: (ctx: IBaseContext, name: string) => Promise<boolean>;
}

export default class SpaceContext implements ISpaceContext {
    public getSpaceById = wrapFireAndThrowError(
        (ctx: IBaseContext, spaceId: string) => {
            return ctx.db.space
                .findOne({
                    spaceId,
                })
                .lean()
                .exec();
        }
    );

    public getSpacesByIds = wrapFireAndThrowError(
        (ctx: IBaseContext, spaceIds: string[]) => {
            return ctx.db.space
                .find({
                    spaceId: {$in: spaceIds},
                })
                .lean()
                .exec();
        }
    );

    public assertGetSpaceById = wrapFireAndThrowError(
        async (ctx: IBaseContext, spaceId: string) => {
            const space = await ctx.space.getSpaceById(ctx, spaceId);

            if (!space) {
                throw new SpaceDoesNotExistError();
            }

            return space;
        }
    );

    public assertSpaceById = wrapFireAndThrowError(
        async (ctx: IBaseContext, spaceId: string) => {
            const exists = await ctx.db.space.exists({
                spaceId,
            });

            if (!exists) {
                throw new SpaceDoesNotExistError();
            }

            return exists;
        }
    );

    public updateSpaceById = wrapFireAndThrowError(
        (ctx: IBaseContext, spaceId: string, data: Partial<ISpace>) => {
            return ctx.db.space
                .findOneAndUpdate({spaceId}, data, {
                    new: true,
                })
                .lean()
                .exec();
        }
    );

    public deleteSpace = wrapFireAndThrowError(
        async (ctx: IBaseContext, spaceId: string) => {
            await ctx.db.space.deleteOne({spaceId}).exec();
        }
    );

    public spaceExists = wrapFireAndThrowError(
        async (ctx: IBaseContext, name: string) => {
            return ctx.db.space.exists({
                name: {$regex: name, $options: 'i'},
            });
        }
    );

    public saveSpace = wrapFireAndThrowError(
        async (ctx: IBaseContext, space: ISpace) => {
            const spaceDoc = new ctx.db.space(space);
            return await spaceDoc.save();
        }
    );
}

export const getSpaceContext = singletonFunc(() => new SpaceContext());
