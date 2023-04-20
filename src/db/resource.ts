import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
import {ResourceWrapper} from '../definitions/system';
import {AnyObject} from '../utils/types';
import {ensureMongoTypeFields} from './utils';

const resourceSchema = ensureMongoTypeFields<ResourceWrapper>({
  resourceId: {type: String, unique: true, index: true},
  resource: {type: SchemaTypes.Map},
  resourceType: {type: String, index: true},
});
export type ResourceDocument = Document<ResourceWrapper>;

const schema = new Schema<AnyObject>(resourceSchema);
const modelName = 'resource';
const collectionName = 'resources';

export function getResourceModel(connection: Connection) {
  const model = connection.model<ResourceWrapper>(modelName, schema, collectionName);
  return model;
}

export type ResourceModel = Model<ResourceWrapper>;
