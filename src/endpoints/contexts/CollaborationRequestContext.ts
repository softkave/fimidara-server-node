import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import {IBaseContext} from './BaseContext';

export interface ICollaborationRequestContext {
    getCollaborationRequestById: (
        ctx: IBaseContext,
        id: string
    ) => Promise<ICollaborationRequest | null>;
    getUserCollaborationRequests: (
        ctx: IBaseContext,
        email: string
    ) => Promise<ICollaborationRequest[] | null>;
    updateCollaborationRequestById: (
        ctx: IBaseContext,
        requestId: string,
        data: Partial<ICollaborationRequest>
    ) => Promise<ICollaborationRequest | null>;
    updateCollaborationRequestsByOrgId: (
        ctx: IBaseContext,
        orgId: string,
        data: Partial<{
            organizationName: string;
        }>
    ) => Promise<void>;
    deleteCollaborationRequestById: (
        ctx: IBaseContext,
        requestId: string
    ) => Promise<void>;
    getCollaborationRequestsByRecipientEmail: (
        ctx: IBaseContext,
        emails: string[],
        orgId: string
    ) => Promise<ICollaborationRequest[]>;
    bulkSaveCollaborationRequests: (
        ctx: IBaseContext,
        collaborationRequests: ICollaborationRequest[]
    ) => Promise<ICollaborationRequest[]>;
    getCollaborationRequestsByOrgId: (
        ctx: IBaseContext,
        organizationId: string
    ) => Promise<ICollaborationRequest[]>;
    saveCollaborationRequest: (
        ctx: IBaseContext,
        collaborationRequest: ICollaborationRequest
    ) => Promise<ICollaborationRequest>;
}

export default class CollaborationRequestContext
    implements ICollaborationRequestContext {
    public getCollaborationRequestById = wrapFireAndThrowError(
        (ctx: IBaseContext, id: string) => {
            return ctx.db.collaborationRequest
                .findOne({requestId: id})
                .lean()
                .exec();
        }
    );

    public updateCollaborationRequestById = wrapFireAndThrowError(
        (
            ctx: IBaseContext,
            requestId: string,
            data: Partial<ICollaborationRequest>
        ) => {
            return ctx.db.collaborationRequest
                .findOneAndUpdate({requestId}, data, {new: true})
                .lean()
                .exec();
        }
    );

    public updateCollaborationRequestsByOrgId = wrapFireAndThrowError(
        async (
            ctx: IBaseContext,
            organizationId: string,
            data: Partial<ICollaborationRequest>
        ) => {
            await ctx.db.collaborationRequest
                .updateMany({organizationId}, data, {new: true})
                .lean()
                .exec();
        }
    );

    public getUserCollaborationRequests = wrapFireAndThrowError(
        (ctx: IBaseContext, email: string) => {
            return ctx.db.collaborationRequest
                .find({
                    recipientEmail: email,
                })
                .lean()
                .exec();
        }
    );

    public deleteCollaborationRequestById = wrapFireAndThrowError(
        async (ctx: IBaseContext, id: string) => {
            await ctx.db.collaborationRequest.deleteOne({requestId: id}).exec();
        }
    );

    public getCollaborationRequestsByRecipientEmail = wrapFireAndThrowError(
        (ctx: IBaseContext, emails: string[], organizationId: string) => {
            return ctx.db.collaborationRequest
                .find({
                    organizationId,
                    recipientEmail: {
                        $in: emails,
                    },
                })
                .lean()
                .exec();
        }
    );

    public bulkSaveCollaborationRequests = wrapFireAndThrowError(
        (ctx: IBaseContext, collaborationRequests: ICollaborationRequest[]) => {
            return ctx.db.collaborationRequest.insertMany(
                collaborationRequests
            );
        }
    );

    public getCollaborationRequestsByOrgId = wrapFireAndThrowError(
        (ctx: IBaseContext, organizationId: string) => {
            return ctx.db.collaborationRequest
                .find({
                    organizationId,
                })
                .lean()
                .exec();
        }
    );

    public async saveCollaborationRequest(
        ctx: IBaseContext,
        collaborationRequest: ICollaborationRequest
    ) {
        const collaborationRequestDoc = new ctx.db.collaborationRequest(
            collaborationRequest
        );

        collaborationRequestDoc.save();
        return collaborationRequestDoc;
    }
}

export const getCollaborationRequestContext = singletonFunc(
    () => new CollaborationRequestContext()
);
