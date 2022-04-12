import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
import {IAssignedItem} from '../definitions/assignedItem';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const assignedItemSchema = ensureTypeFields<IAssignedItem>({
  resourceId: {type: String},
  workspaceId: {type: String},
  assignedAt: {type: Date, default: getDate},
  assignedBy: {type: agentSchema},
  assignedItemId: {type: String},
  assignedItemType: {type: String},
  assignedToItemId: {type: String},
  assignedToItemType: {type: String},
  meta: {type: SchemaTypes.Map},
});

export type IAssignedItemDocument = Document<IAssignedItem>;

const schema = new Schema<IAssignedItem>(assignedItemSchema);
const modelName = 'assigned-item';
const collectionName = 'assigned-items';

export function getAssignedItemModel(connection: Connection) {
  const model = connection.model<IAssignedItemDocument>(
    modelName,
    schema,
    collectionName
  );

  return model;
}

export type IAssignedItemModel = Model<IAssignedItemDocument>;
