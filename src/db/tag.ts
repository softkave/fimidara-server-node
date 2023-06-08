import {Connection, Document, Model, Schema} from 'mongoose';
import {Tag} from '../definitions/tag';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const tagSchema = ensureMongoTypeFields<Tag>({
  ...workspaceResourceSchema,
  name: {type: String, index: true},
  description: {type: String},
});

export type TagDocument = Document<Tag>;

const schema = new Schema<Tag>(tagSchema);
const modelName = 'tag';
const collectionName = 'tags';

export function getTagModel(connection: Connection) {
  const model = connection.model<Tag>(modelName, schema, collectionName);
  return model;
}

export type TagModel = Model<Tag>;
