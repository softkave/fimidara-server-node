import {Connection, Document, Model, Schema} from 'mongoose';
import {
    IBucket,
    IBucketTransformerMapping,
    IBucketTransformerTransform,
} from '../definitions/bucket';
import {ITransformerParameterValue} from '../definitions/transformers';
import {getDate} from '../utilities/dateFns';
import {ensureTypeFields} from './utils';

const parameterValueSchema = ensureTypeFields<ITransformerParameterValue>({
    paramValue: {type: Number},
    paramName: {type: String},
    paramType: {type: String},
    defaultValue: {type: Number},
});

const bucketTransformerTransformSchema = ensureTypeFields<IBucketTransformerTransform>(
    {
        params: {type: [parameterValueSchema]},
        transformId: {type: String, index: true},
        name: {type: String},
        description: {type: String},
        createdAt: {type: Date, default: getDate},
        createdBy: {type: String},
        lastUpdatedBy: {type: String},
        lastUpdatedAt: {type: Date},
    }
);

const bucketTransformerMappingSchema = ensureTypeFields<IBucketTransformerMapping>(
    {
        mimetype: {type: String, index: true},
        transformerId: {type: String},
    }
);

const bucketSchema = ensureTypeFields<IBucket>({
    bucketId: {type: String, unique: true, index: true},
    createdBy: {type: String},
    createdAt: {type: Date, default: getDate},
    lastUpdatedBy: {type: String},
    lastUpdatedAt: {type: Date},
    name: {type: String, unique: true, index: true},
    description: {type: String},
    organizationId: {type: String, index: true},
    environmentId: {type: String, index: true},
    projectId: {type: String},
    transforms: {type: [bucketTransformerTransformSchema]},
    transformerMappings: {type: [bucketTransformerMappingSchema]},
});

export interface IBucketDocument extends Document, IBucket {}

const schema = new Schema<IBucketDocument>(bucketSchema);
const modelName = 'bucket';
const collectionName = 'buckets';

export function getBucketModel(connection: Connection) {
    const model = connection.model<IBucketDocument>(
        modelName,
        schema,
        collectionName
    );

    return model;
}

export type IBucketModel = Model<IBucketDocument>;
