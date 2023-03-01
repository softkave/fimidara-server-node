import {Connection, Document, Model, Schema} from 'mongoose';
import {ITag} from '../definitions/tag';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const tagSchema = ensureMongoTypeFields<ITag>({
  ...workspaceResourceSchema,
  name: {type: String, index: true},
  description: {type: String},
});

export type ITagDocument = Document<ITag>;

const schema = new Schema<ITag>(tagSchema);
const modelName = 'tag';
const collectionName = 'tags';

export function getTagModel(connection: Connection) {
  const model = connection.model<ITag>(modelName, schema, collectionName);
  return model;
}

export type ITagModel = Model<ITag>;
