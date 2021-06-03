import {ITransformer} from '../../definitions/transformers';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import {TransformerDoesNotExistError} from '../transformers/errors';
import {IBaseContext} from './BaseContext';

export interface ITransformerContext {
    getTransformerById: (
        ctx: IBaseContext,
        transformerId: string
    ) => Promise<ITransformer | null>;
    getTransformersByIds: (
        ctx: IBaseContext,
        transformerIds: string[]
    ) => Promise<ITransformer[]>;
    assertGetTransformerById: (
        ctx: IBaseContext,
        transformerId: string
    ) => Promise<ITransformer>;
    assertTransformerById: (
        ctx: IBaseContext,
        transformerId: string
    ) => Promise<boolean>;
    updateTransformerById: (
        ctx: IBaseContext,
        transformerId: string,
        data: Partial<ITransformer>
    ) => Promise<ITransformer | null>;
    saveTransformer: (
        ctx: IBaseContext,
        transformer: ITransformer
    ) => Promise<ITransformer>;
    deleteTransformer: (
        ctx: IBaseContext,
        transformerId: string
    ) => Promise<void>;
    transformerExists: (ctx: IBaseContext, name: string) => Promise<boolean>;
}

export default class TransformerContext implements ITransformerContext {
    public getTransformerById = wrapFireAndThrowError(
        (ctx: IBaseContext, transformerId: string) => {
            return ctx.db.transformer
                .findOne({
                    transformerId,
                })
                .lean()
                .exec();
        }
    );

    public getTransformersByIds = wrapFireAndThrowError(
        (ctx: IBaseContext, transformerIds: string[]) => {
            return ctx.db.transformer
                .find({
                    transformerId: {$in: transformerIds},
                })
                .lean()
                .exec();
        }
    );

    public assertGetTransformerById = wrapFireAndThrowError(
        async (ctx: IBaseContext, transformerId: string) => {
            const transformer = await ctx.transformer.getTransformerById(
                ctx,
                transformerId
            );

            if (!transformer) {
                throw new TransformerDoesNotExistError();
            }

            return transformer;
        }
    );

    public assertTransformerById = wrapFireAndThrowError(
        async (ctx: IBaseContext, transformerId: string) => {
            const exists = await ctx.db.transformer.exists({
                transformerId,
            });

            if (!exists) {
                throw new TransformerDoesNotExistError();
            }

            return exists;
        }
    );

    public updateTransformerById = wrapFireAndThrowError(
        (
            ctx: IBaseContext,
            transformerId: string,
            data: Partial<ITransformer>
        ) => {
            return ctx.db.transformer
                .findOneAndUpdate({transformerId}, data, {
                    new: true,
                })
                .lean()
                .exec();
        }
    );

    public deleteTransformer = wrapFireAndThrowError(
        async (ctx: IBaseContext, transformerId: string) => {
            await ctx.db.transformer.deleteOne({transformerId}).exec();
        }
    );

    public transformerExists = wrapFireAndThrowError(
        async (ctx: IBaseContext, name: string) => {
            return ctx.db.transformer.exists({
                name: {$regex: name, $options: 'i'},
            });
        }
    );

    public saveTransformer = wrapFireAndThrowError(
        async (ctx: IBaseContext, transformer: ITransformer) => {
            const transformerDoc = new ctx.db.transformer(transformer);
            return await transformerDoc.save();
        }
    );
}

export const getTransformerContext = singletonFunc(
    () => new TransformerContext()
);
