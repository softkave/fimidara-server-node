/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable-next-line @typescript-eslint/ban-types */

import {SchemaDefinitionProperty} from 'mongoose';

// ensures all the fields defined in the type are added to the schema
export function ensureTypeFields<T extends object>(
    schema: Record<keyof T, SchemaDefinitionProperty>
): Record<keyof T, SchemaDefinitionProperty> {
    return schema;
}
