import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
import {AssignedItem} from '../definitions/assignedItem';
import {ensureMongoTypeFields, workspaceResourceSchema} from './utils';

const assignedItemSchema = ensureMongoTypeFields<AssignedItem>({
  ...workspaceResourceSchema,
  assignedItemId: {type: String, index: true},
  assignedItemType: {type: String, index: true},
  assigneeId: {type: String, index: true},
  assigneeType: {type: String, index: true},
  meta: {type: SchemaTypes.Map},
});

export type AssignedItemDocument = Document<AssignedItem>;

const schema = new Schema<AssignedItem>(assignedItemSchema);
const modelName = 'assigned-item';
const collectionName = 'assigned-items';

export function getAssignedItemModel(connection: Connection) {
  const model = connection.model<AssignedItem>(modelName, schema, collectionName);
  return model;
}

export type AssignedItemModel = Model<AssignedItem>;
