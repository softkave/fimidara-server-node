import {IEnvironment} from '../../definitions/environment';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import {EnvironmentDoesNotExistError} from '../environments/errors';
import {IBaseContext} from './BaseContext';

export interface IEnvironmentContext {
    getEnvironmentById: (
        ctx: IBaseContext,
        environmentId: string
    ) => Promise<IEnvironment | null>;
    getEnvironmentsByIds: (
        ctx: IBaseContext,
        environmentIds: string[]
    ) => Promise<IEnvironment[]>;
    assertGetEnvironmentById: (
        ctx: IBaseContext,
        environmentId: string
    ) => Promise<IEnvironment>;
    assertEnvironmentById: (
        ctx: IBaseContext,
        environmentId: string
    ) => Promise<boolean>;
    updateEnvironmentById: (
        ctx: IBaseContext,
        environmentId: string,
        data: Partial<IEnvironment>
    ) => Promise<IEnvironment | null>;
    saveEnvironment: (
        ctx: IBaseContext,
        environment: IEnvironment
    ) => Promise<IEnvironment>;
    deleteEnvironment: (
        ctx: IBaseContext,
        environmentId: string
    ) => Promise<void>;
    environmentExists: (ctx: IBaseContext, name: string) => Promise<boolean>;
}

export default class EnvironmentContext implements IEnvironmentContext {
    public getEnvironmentById = wrapFireAndThrowError(
        (ctx: IBaseContext, environmentId: string) => {
            return ctx.db.environment
                .findOne({
                    environmentId,
                })
                .lean()
                .exec();
        }
    );

    public getEnvironmentsByIds = wrapFireAndThrowError(
        (ctx: IBaseContext, environmentIds: string[]) => {
            return ctx.db.environment
                .find({
                    environmentId: {$in: environmentIds},
                })
                .lean()
                .exec();
        }
    );

    public assertGetEnvironmentById = wrapFireAndThrowError(
        async (ctx: IBaseContext, environmentId: string) => {
            const environment = await ctx.environment.getEnvironmentById(
                ctx,
                environmentId
            );

            if (!environment) {
                throw new EnvironmentDoesNotExistError();
            }

            return environment;
        }
    );

    public assertEnvironmentById = wrapFireAndThrowError(
        async (ctx: IBaseContext, environmentId: string) => {
            const exists = await ctx.db.environment.exists({
                environmentId,
            });

            if (!exists) {
                throw new EnvironmentDoesNotExistError();
            }

            return exists;
        }
    );

    public updateEnvironmentById = wrapFireAndThrowError(
        (
            ctx: IBaseContext,
            environmentId: string,
            data: Partial<IEnvironment>
        ) => {
            return ctx.db.environment
                .findOneAndUpdate({environmentId}, data, {
                    new: true,
                })
                .lean()
                .exec();
        }
    );

    public deleteEnvironment = wrapFireAndThrowError(
        async (ctx: IBaseContext, environmentId: string) => {
            await ctx.db.environment.deleteOne({environmentId}).exec();
        }
    );

    public environmentExists = wrapFireAndThrowError(
        async (ctx: IBaseContext, name: string) => {
            return ctx.db.environment.exists({
                name: {$regex: name, $options: 'i'},
            });
        }
    );

    public saveEnvironment = wrapFireAndThrowError(
        async (ctx: IBaseContext, environment: IEnvironment) => {
            const environmentDoc = new ctx.db.environment(environment);
            return await environmentDoc.save();
        }
    );
}

export const getEnvironmentContext = singletonFunc(
    () => new EnvironmentContext()
);
