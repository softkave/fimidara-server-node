import {Connection, Document, Model, Schema} from 'mongoose';
import {ICollaborationRequest} from '../definitions/collaborationRequest';
import {getDate} from '../utilities/dateFns';

const collaborationRequestStatusHistorySchema = {
    status: {type: String},
    date: {type: Date},
};

const notificationSentEmailHistorySchema = {
    date: {type: Date},
    reason: {type: String},
};

const collaborationRequestSchema = {
    requestId: {type: String, unique: true, index: true},
    recipientEmail: {type: String, index: true},
    message: {type: String},
    createdBy: {type: String},
    createdAt: {type: Date, default: () => getDate()},
    expiresAt: {type: Date},
    readAt: {type: Date},
    statusHistory: {
        type: [collaborationRequestStatusHistorySchema],
        default: [],
    },
    sentEmailHistory: {type: [notificationSentEmailHistorySchema], default: []},
    organizationId: {type: String, index: true},
    organizationName: {type: String},
};

export interface ICollaborationRequestDocument
    extends Document,
        ICollaborationRequest {}

const schema = new Schema<ICollaborationRequestDocument>(
    collaborationRequestSchema
);
const modelName = 'collaborationRequest';
const collectionName = 'collaborationRequests';

export function getCollaborationRequestModel(connection: Connection) {
    const model = connection.model<ICollaborationRequestDocument>(
        modelName,
        schema,
        collectionName
    );

    return model;
}

export type ICollaborationRequestModel = Model<ICollaborationRequestDocument>;
