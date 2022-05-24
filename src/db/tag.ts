import {Connection, Document, Model, Schema} from 'mongoose';
import {ITag} from '../definitions/tag';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const tagSchema = ensureTypeFields<ITag>({
  resourceId: {type: String, unique: true, index: true},
  workspaceId: {type: String, index: true},
  name: {type: String, index: true},
  createdAt: {type: Date, default: getDate},
  createdBy: {type: agentSchema},
  lastUpdatedAt: {type: Date},
  lastUpdatedBy: {type: agentSchema},
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
