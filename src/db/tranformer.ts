import {Connection, Document, Model, Schema} from 'mongoose';
import {ITransformer, ITransformerParameter} from '../definitions/transformers';
import {ensureTypeFields} from './utils';

const transformerParameterSchema = ensureTypeFields<ITransformerParameter>({
    paramName: {type: String},
    paramType: {type: String},
    defaultValue: {type: Number},
});

const transformerSchema = ensureTypeFields<ITransformer>({
    transformerId: {type: String, unique: true, index: true},
    name: {type: String},
    description: {type: String},
    params: {typee: [transformerParameterSchema]},
});

export interface ITransformerDocument extends Document, ITransformer {}

const schema = new Schema<ITransformerDocument>(transformerSchema);
const modelName = 'transformer';
const collectionName = 'transformers';

export function getTransformerModel(connection: Connection) {
    const model = connection.model<ITransformerDocument>(
        modelName,
        schema,
        collectionName
    );

    return model;
}

export type ITransformerModel = Model<ITransformerDocument>;
