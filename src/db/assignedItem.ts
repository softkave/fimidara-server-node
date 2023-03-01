import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
import {IAssignedItem} from '../definitions/assignedItem';
import {ensureTypeFields, workspaceResourceSchema} from './utils';

const assignedItemSchema = ensureTypeFields<IAssignedItem>({
  ...workspaceResourceSchema,
  assignedItemId: {type: String, index: true},
  assignedItemType: {type: String, index: true},
  assignedToItemId: {type: String, index: true},
  assignedToItemType: {type: String, index: true},
  meta: {type: SchemaTypes.Map},
});

export type IAssignedItemDocument = Document<IAssignedItem>;

const schema = new Schema<IAssignedItem>(assignedItemSchema);
const modelName = 'assigned-item';
const collectionName = 'assigned-items';

export function getAssignedItemModel(connection: Connection) {
  const model = connection.model<IAssignedItem>(modelName, schema, collectionName);
  return model;
}

export type IAssignedItemModel = Model<IAssignedItem>;
