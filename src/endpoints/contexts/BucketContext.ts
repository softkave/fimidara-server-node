import {IBucket} from '../../definitions/bucket';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import {BucketDoesNotExistError} from '../buckets/errors';
import {IBaseContext} from './BaseContext';

export interface IBucketContext {
    getBucketById: (
        ctx: IBaseContext,
        bucketId: string
    ) => Promise<IBucket | null>;
    getBucketsByIds: (
        ctx: IBaseContext,
        bucketIds: string[]
    ) => Promise<IBucket[]>;
    assertGetBucketById: (
        ctx: IBaseContext,
        bucketId: string
    ) => Promise<IBucket>;
    assertBucketById: (ctx: IBaseContext, bucketId: string) => Promise<boolean>;
    updateBucketById: (
        ctx: IBaseContext,
        bucketId: string,
        data: Partial<IBucket>
    ) => Promise<IBucket | null>;
    saveBucket: (ctx: IBaseContext, bucket: IBucket) => Promise<IBucket>;
    deleteBucket: (ctx: IBaseContext, bucketId: string) => Promise<void>;
    bucketExists: (ctx: IBaseContext, name: string) => Promise<boolean>;
}

export default class BucketContext implements IBucketContext {
    public getBucketById = wrapFireAndThrowError(
        (ctx: IBaseContext, bucketId: string) => {
            return ctx.db.bucket
                .findOne({
                    bucketId,
                })
                .lean()
                .exec();
        }
    );

    public getBucketsByIds = wrapFireAndThrowError(
        (ctx: IBaseContext, bucketIds: string[]) => {
            return ctx.db.bucket
                .find({
                    bucketId: {$in: bucketIds},
                })
                .lean()
                .exec();
        }
    );

    public assertGetBucketById = wrapFireAndThrowError(
        async (ctx: IBaseContext, bucketId: string) => {
            const bucket = await ctx.bucket.getBucketById(ctx, bucketId);

            if (!bucket) {
                throw new BucketDoesNotExistError();
            }

            return bucket;
        }
    );

    public assertBucketById = wrapFireAndThrowError(
        async (ctx: IBaseContext, bucketId: string) => {
            const exists = await ctx.db.bucket.exists({
                bucketId,
            });

            if (!exists) {
                throw new BucketDoesNotExistError();
            }

            return exists;
        }
    );

    public updateBucketById = wrapFireAndThrowError(
        (ctx: IBaseContext, bucketId: string, data: Partial<IBucket>) => {
            return ctx.db.bucket
                .findOneAndUpdate({bucketId}, data, {
                    new: true,
                })
                .lean()
                .exec();
        }
    );

    public deleteBucket = wrapFireAndThrowError(
        async (ctx: IBaseContext, bucketId: string) => {
            await ctx.db.bucket.deleteOne({bucketId}).exec();
        }
    );

    public bucketExists = wrapFireAndThrowError(
        async (ctx: IBaseContext, name: string) => {
            return ctx.db.bucket.exists({
                name: {$regex: name, $options: 'i'},
            });
        }
    );

    public saveBucket = wrapFireAndThrowError(
        async (ctx: IBaseContext, bucket: IBucket) => {
            const bucketDoc = new ctx.db.bucket(bucket);
            return await bucketDoc.save();
        }
    );
}

export const getBucketContext = singletonFunc(() => new BucketContext());
