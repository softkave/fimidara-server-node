import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
import {IAssignedItem} from '../definitions/assignedItem';
import {getDate} from '../utilities/dateFns';
import {agentSchema, ensureTypeFields} from './utils';

const assignedItemSchema = ensureTypeFields<IAssignedItem>({
  resourceId: {type: String, unique: true, index: true},
  workspaceId: {type: String, index: true},
  assignedItemId: {type: String, index: true},
  assignedItemType: {type: String, index: true},
  assignedToItemId: {type: String, index: true},
  assignedToItemType: {type: String, index: true},
  meta: {type: SchemaTypes.Map},
  assignedAt: {type: Date, default: getDate},
  assignedBy: {type: agentSchema},
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
