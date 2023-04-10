import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
import {IResourceWrapper} from '../definitions/system';
import {AnyObject} from '../utils/types';
import {ensureMongoTypeFields} from './utils';

const resourceSchema = ensureMongoTypeFields<IResourceWrapper>({
  resourceId: {type: String, unique: true, index: true},
  resource: {type: SchemaTypes.Map},
  resourceType: {type: String, index: true},
});
export type IResourceDocument = Document<IResourceWrapper>;

const schema = new Schema<AnyObject>(resourceSchema);
const modelName = 'resource';
const collectionName = 'resources';

export function getResourceModel(connection: Connection) {
  const model = connection.model<IResourceWrapper>(modelName, schema, collectionName);
  return model;
}

export type IResourceModel = Model<IResourceWrapper>;
