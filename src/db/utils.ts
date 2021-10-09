/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable-next-line @typescript-eslint/ban-types */

import {SchemaDefinitionProperty} from 'mongoose';
import {IAgent} from '../definitions/system';

// ensures all the fields defined in the type are added to the schema
export function ensureTypeFields<T extends object>(
  schema: Record<keyof T, SchemaDefinitionProperty>
): Record<keyof T, SchemaDefinitionProperty> {
  return schema;
}

export const agentSchema = ensureTypeFields<IAgent>({
  agentId: {type: String},
  agentType: {type: String},
});
