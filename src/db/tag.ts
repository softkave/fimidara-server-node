import {Connection, Document, Model, Schema} from 'mongoose';
import {IAssignedTag, ITag} from '../definitions/tag';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const tagSchema = ensureTypeFields<ITag>({
  resourceId: {type: String},
  organizationId: {type: String},
  createdAt: {type: Date, default: getDate},
  createdBy: {type: agentSchema},
  lastUpdatedAt: {type: Date},
  lastUpdatedBy: {type: agentSchema},
  name: {type: String},
  description: {type: String},
});

export type ITagDocument = Document<ITag>;

const schema = new Schema<ITag>(tagSchema);
const modelName = 'tag';
const collectionName = 'tags';

export function getTagModel(connection: Connection) {
  const model = connection.model<ITagDocument>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type ITagModel = Model<ITagDocument>;
