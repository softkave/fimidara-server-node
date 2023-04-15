import * as fse from 'fs-extra';
import {compact} from 'lodash';
import {endpointConstants} from '../endpoints/constants';
import {readFileEndpointDefinition} from '../endpoints/files/endpoints.mddoc';
import {addWorkspaceEndpointDefinition} from '../endpoints/workspaces/endpoints.mddoc';
import {
  FieldArray,
  FieldBinary,
  FieldBoolean,
  FieldDate,
  FieldNull,
  FieldNumber,
  FieldObject,
  FieldOrCombination,
  FieldString,
  FieldUndefined,
  MddocTypeFieldArray,
  MddocTypeFieldBase,
  MddocTypeFieldBinary,
  MddocTypeFieldBoolean,
  MddocTypeFieldDate,
  MddocTypeFieldNumber,
  MddocTypeFieldObject,
  MddocTypeFieldOrCombination,
  MddocTypeFieldString,
  MddocTypeFieldUndefined,
  MddocTypeHttpEndpoint,
  httpPathParameterToFieldObject,
  isObjectField,
} from './mddoc';
import path = require('path');

const objectTypeCache: Map<string, string> = new Map();

function getEnumType(item: MddocTypeFieldString) {
  return item
    .assertGetValid()
    .map(next => `"${next}"`)
    .join(' | ');
}
function getStringType(item: MddocTypeFieldString) {
  return item.getValid()?.length ? getEnumType(item) : 'string';
}
function getNumberType(item: MddocTypeFieldNumber) {
  return 'number';
}
function getBooleanType(item: MddocTypeFieldBoolean) {
  return 'boolean';
}
function getNullType(item: MddocTypeFieldNumber) {
  return 'null';
}
function getUndefinedType(item: MddocTypeFieldUndefined) {
  return 'undefined';
}
function getDateType(item: MddocTypeFieldDate) {
  return 'number';
}
function getArrayType(item: MddocTypeFieldArray) {
  const ofType = item.assertGetType();
  const typeString = getType(ofType);
  return `Array<${typeString}>`;
}
function getOrCombinationType(item: MddocTypeFieldOrCombination) {
  return 'unknown';
}
function getBinaryType(item: MddocTypeFieldBinary) {
  return 'unknown';
}
function getObjectType(item: MddocTypeFieldObject) {
  return item.assertGetName();
}

function getType(item: MddocTypeFieldBase): string {
  if (item instanceof FieldString) {
    return getStringType(item);
  } else if (item instanceof FieldNumber) {
    return getNumberType(item);
  } else if (item instanceof FieldBoolean) {
    return getBooleanType(item);
  } else if (item instanceof FieldNull) {
    return getNullType(item);
  } else if (item instanceof FieldUndefined) {
    return getUndefinedType(item);
  } else if (item instanceof FieldDate) {
    return getDateType(item);
  } else if (item instanceof FieldArray) {
    return getArrayType(item);
  } else if (item instanceof FieldOrCombination) {
    return getOrCombinationType(item);
  } else if (item instanceof FieldBinary) {
    return getBinaryType(item);
  } else if (item instanceof FieldObject) {
    return getObjectType(item);
  } else {
    return 'unknown';
  }
}

function generateObjectDefinition(item: MddocTypeFieldObject, name = item.assertGetName()) {
  if (objectTypeCache.has(name)) {
    return objectTypeCache.get(name);
  }

  const fields = item.getFields() ?? {};
  const entries: string[] = [];
  for (const key in fields) {
    const definition = fields[key];
    const entry = `${key}: ${getType(definition)}`;
    entries.push(entry);
  }

  const text = `export type ${name} = {
    ${entries.join(';\n')}
  }`;
  return text;
}

function generateTypesFromEndpoint(endpoint: MddocTypeHttpEndpoint) {
  const pathParamatersType = endpoint.getPathParamaters()
    ? generateObjectDefinition(httpPathParameterToFieldObject(endpoint.assertGetPathParamaters()))
    : undefined;
  const queryType = endpoint.getQuery()
    ? generateObjectDefinition(endpoint.assertGetQuery(), `${endpoint.assertGetName()}Query`)
    : undefined;
  const requestBody = endpoint.getRequestBody()
    ? isObjectField(endpoint.assertGetRequestBody())
      ? generateObjectDefinition(endpoint.assertGetRequestBody() as MddocTypeFieldObject)
      : 'blob' // TODO
    : undefined;
  // TODO: request header
  const responseBodyDefinition = endpoint
    .getResponses()
    ?.find(response => response.getStatusCode() === endpointConstants.httpStatusCode.ok);
  const responseBodyType = responseBodyDefinition
    ? isObjectField(endpoint.assertGetRequestBody())
      ? generateObjectDefinition(
          responseBodyDefinition.assertGetResponseBody() as MddocTypeFieldObject
        )
      : 'blob' // TODO
    : undefined;

  return {
    pathParamatersType,
    queryType,
    requestBody,
    responseBodyType,
  };
}

function documentTypesFromEndpoint(endpoint: MddocTypeHttpEndpoint) {
  const endpointsDir = './sdk/js-sdk';
  const filename = path.normalize(endpointsDir + '/' + endpoint.assertGetBasePathname() + '.ts');
  const types = generateTypesFromEndpoint(endpoint);
  const doc = compact([
    types.pathParamatersType,
    types.queryType,
    types.requestBody,
    types.responseBodyType,
  ]).join('\n\n');
  fse.ensureFileSync(filename);
  return fse.writeFile(filename, doc, {encoding: 'utf-8'});
}

async function main() {
  await Promise.all([
    documentTypesFromEndpoint(readFileEndpointDefinition),
    documentTypesFromEndpoint(addWorkspaceEndpointDefinition),
  ]);
}

main()
  .then(() => console.log('mddoc gen js sdk complete'))
  .catch(console.error.bind(console));
