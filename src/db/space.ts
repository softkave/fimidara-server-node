import {Connection, Document, Model, Schema} from 'mongoose';
import {ISpace} from '../definitions/space';
import {getDate} from '../utilities/dateFns';
import {ensureTypeFields} from './utils';

const spaceSchema = ensureTypeFields<ISpace>({
    spaceId: {type: String, unique: true, index: true},
    createdBy: {type: String},
    createdAt: {type: Date, default: getDate},
    lastUpdatedBy: {type: String},
    lastUpdatedAt: {type: Date},
    name: {type: String, unique: true, index: true},
    description: {type: String},
    organizationId: {type: String, index: true},
    environmentId: {type: String, index: true},
});

export interface ISpaceDocument extends Document, ISpace {}

const schema = new Schema<ISpaceDocument>(spaceSchema);
const modelName = 'space';
const collectionName = 'spaces';

export function getSpaceModel(connection: Connection) {
    const model = connection.model<ISpaceDocument>(
        modelName,
        schema,
        collectionName
    );

    return model;
}

export type ISpaceModel = Model<ISpaceDocument>;
