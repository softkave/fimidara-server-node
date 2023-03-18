import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
import {IResource} from '../definitions/system';
import {AnyObject} from '../utils/types';

const resourceSchema = SchemaTypes.Map;
export type IResourceDocument = Document<IResource>;

const schema = new Schema<AnyObject>(resourceSchema);
const modelName = 'resource';
const collectionName = 'resources';

export function getResourceModel(connection: Connection) {
  const model = connection.model<IResource>(modelName, schema, collectionName);
  return model;
}

export type IResourceModel = Model<IResource>;
