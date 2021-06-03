import {IOrganization} from '../../definitions/organization';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import {OrganizationDoesNotExistError} from '../organizations/errors';
import {IBaseContext} from './BaseContext';

export interface IOrganizationContext {
    getOrganizationById: (
        ctx: IBaseContext,
        organizationId: string
    ) => Promise<IOrganization | null>;
    getOrganizationsByIds: (
        ctx: IBaseContext,
        organizationIds: string[]
    ) => Promise<IOrganization[]>;
    assertGetOrganizationById: (
        ctx: IBaseContext,
        organizationId: string
    ) => Promise<IOrganization>;
    assertOrganizationById: (
        ctx: IBaseContext,
        organizationId: string
    ) => Promise<boolean>;
    updateOrganizationById: (
        ctx: IBaseContext,
        organizationId: string,
        data: Partial<IOrganization>
    ) => Promise<IOrganization | null>;
    saveOrganization: (
        ctx: IBaseContext,
        organization: IOrganization
    ) => Promise<IOrganization>;
    deleteOrganization: (
        ctx: IBaseContext,
        organizationId: string
    ) => Promise<void>;
    organizationExists: (ctx: IBaseContext, name: string) => Promise<boolean>;
}

export default class OrganizationContext implements IOrganizationContext {
    public getOrganizationById = wrapFireAndThrowError(
        (ctx: IBaseContext, organizationId: string) => {
            return ctx.db.organization
                .findOne({
                    organizationId,
                })
                .lean()
                .exec();
        }
    );

    public getOrganizationsByIds = wrapFireAndThrowError(
        (ctx: IBaseContext, organizationIds: string[]) => {
            return ctx.db.organization
                .find({
                    organizationId: {$in: organizationIds},
                })
                .lean()
                .exec();
        }
    );

    public assertGetOrganizationById = wrapFireAndThrowError(
        async (ctx: IBaseContext, organizationId: string) => {
            const organization = await ctx.organization.getOrganizationById(
                ctx,
                organizationId
            );

            if (!organization) {
                throw new OrganizationDoesNotExistError();
            }

            return organization;
        }
    );

    public assertOrganizationById = wrapFireAndThrowError(
        async (ctx: IBaseContext, organizationId: string) => {
            const exists = await ctx.db.organization.exists({
                organizationId,
            });

            if (!exists) {
                throw new OrganizationDoesNotExistError();
            }

            return exists;
        }
    );

    public updateOrganizationById = wrapFireAndThrowError(
        (
            ctx: IBaseContext,
            organizationId: string,
            data: Partial<IOrganization>
        ) => {
            return ctx.db.organization
                .findOneAndUpdate({organizationId}, data, {
                    new: true,
                })
                .lean()
                .exec();
        }
    );

    public deleteOrganization = wrapFireAndThrowError(
        async (ctx: IBaseContext, organizationId: string) => {
            await ctx.db.organization.deleteOne({organizationId}).exec();
        }
    );

    public organizationExists = wrapFireAndThrowError(
        async (ctx: IBaseContext, name: string) => {
            return ctx.db.organization.exists({
                name: {$regex: name, $options: 'i'},
            });
        }
    );

    public saveOrganization = wrapFireAndThrowError(
        async (ctx: IBaseContext, organization: IOrganization) => {
            const organizationDoc = new ctx.db.organization(organization);
            return await organizationDoc.save();
        }
    );
}

export const getOrganizationContext = singletonFunc(
    () => new OrganizationContext()
);
