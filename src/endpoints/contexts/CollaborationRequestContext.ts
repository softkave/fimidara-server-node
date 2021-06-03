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
        customId: string,
        data: Partial<ICollaborationRequest>
    ) => Promise<ICollaborationRequest | null>;
    deleteCollaborationRequestById: (
        ctx: IBaseContext,
        customId: string
    ) => Promise<void>;
    getCollaborationRequestsByRecipientEmail: (
        ctx: IBaseContext,
        emails: string[],
        blockId: string
    ) => Promise<ICollaborationRequest[]>;
    bulkSaveCollaborationRequests: (
        ctx: IBaseContext,
        collaborationRequests: ICollaborationRequest[]
    ) => Promise<ICollaborationRequest[]>;
    getCollaborationRequestsByBlockId: (
        ctx: IBaseContext,
        blockId: string
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
                .findOne({customId: id})
                .lean()
                .exec();
        }
    );

    public updateCollaborationRequestById = wrapFireAndThrowError(
        (
            ctx: IBaseContext,
            customId: string,
            data: Partial<ICollaborationRequest>
        ) => {
            return ctx.db.collaborationRequest
                .findOneAndUpdate({customId}, data, {new: true})
                .lean()
                .exec();
        }
    );

    public getUserCollaborationRequests = wrapFireAndThrowError(
        (ctx: IBaseContext, email: string) => {
            return ctx.db.collaborationRequest
                .find({
                    'to.email': email,
                })
                .lean()
                .exec();
        }
    );

    public deleteCollaborationRequestById = wrapFireAndThrowError(
        async (ctx: IBaseContext, id: string) => {
            await ctx.db.collaborationRequest.deleteOne({customId: id}).exec();
        }
    );

    public getCollaborationRequestsByRecipientEmail = wrapFireAndThrowError(
        (ctx: IBaseContext, emails: string[], blockId: string) => {
            return ctx.db.collaborationRequest
                .find({
                    'to.email': {
                        $in: emails,
                    },
                    'from.blockId': blockId,
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

    public getCollaborationRequestsByBlockId = wrapFireAndThrowError(
        (ctx: IBaseContext, blockId: string) => {
            return ctx.db.collaborationRequest
                .find({
                    'from.blockId': blockId,
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
