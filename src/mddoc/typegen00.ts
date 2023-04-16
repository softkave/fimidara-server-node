import * as fse from 'fs-extra';
import {set} from 'lodash';
import {mddocEndpointHttpHeaderItems, mddocEndpointStatusCodes} from '../endpoints/endpoints.mddoc';
import {readFileEndpointDefinition} from '../endpoints/files/endpoints.mddoc';
import {addPermissionItemsEndpointDefinition} from '../endpoints/permissionItems/endpoints.mddoc';
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
  httpHeadersToFieldObject,
  isFieldBinary,
  isMultipartFormdata,
  isObjectField,
  objectHasRequiredFields,
} from './mddoc';
import path = require('path');

class Doc {
  protected disclaimer =
    '// This file is auto-generated, do not modify directly. \n' +
    '// Reach out to @abayomi to suggest changes.\n';
  protected endpointsText = '';
  protected typesText = '';
  protected importsText = '';
  protected indentationCount = 0;

  appendType(typeText: string) {
    this.typesText += this.getLineIndentation() + typeText + '\n';
    return this;
  }

  appendEndpoint(endpoint: string) {
    this.endpointsText += this.getLineIndentation() + endpoint + '\n';
    return this;
  }

  appendImport(importText: string) {
    this.importsText += importText + '\n';
    return this;
  }

  startIndentation() {
    this.indentationCount += 1;
    return this;
  }

  endIndentation() {
    this.indentationCount -= 1;
    return this;
  }

  compileText() {
    return (
      this.disclaimer + '\n' + this.importsText + '\n' + this.typesText + '\n' + this.endpointsText
    );
  }

  protected getLineIndentation() {
    return this.indentationCount
      ? new Array(this.indentationCount + 1).fill(undefined).join('  ')
      : '';
  }
}

const generatedTypeCache: Map<string, boolean> = new Map();

function getEnumType(doc: Doc, item: MddocTypeFieldString) {
  const name = item.getEnumName();
  if (name && generatedTypeCache.has(name)) {
    return name;
  }

  const text = item
    .assertGetValid()
    .map(next => `"${next}"`)
    .join(' | ');

  if (name) {
    generatedTypeCache.set(name, true);
    doc.appendType(`export type ${name} = ${text}`);
    return name;
  }

  return text;
}
function getStringType(doc: Doc, item: MddocTypeFieldString) {
  return item.getValid()?.length ? getEnumType(doc, item) : 'string';
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
function getArrayType(doc: Doc, item: MddocTypeFieldArray) {
  const ofType = item.assertGetType();
  const typeString = getType(doc, ofType);
  return `Array<${typeString}>`;
}
function getOrCombinationType(doc: Doc, item: MddocTypeFieldOrCombination) {
  return item
    .assertGetTypes()
    .map(next => getType(doc, next))
    .join(' | ');
}
function getBinaryType(item: MddocTypeFieldBinary) {
  return 'string | Readable | ReadableStream';
}

function getType(doc: Doc, item: MddocTypeFieldBase): string {
  if (item instanceof FieldString) {
    return getStringType(doc, item);
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
    return getArrayType(doc, item);
  } else if (item instanceof FieldOrCombination) {
    return getOrCombinationType(doc, item);
  } else if (item instanceof FieldBinary) {
    return getBinaryType(item);
  } else if (item instanceof FieldObject) {
    return generateObjectDefinition(doc, item);
  } else {
    return 'unknown';
  }
}

function shouldEncloseObjectKeyInQuotes(key: string) {
  return /[0-9]/.test(key[0]) || /[^A-Za-z0-9]/.test(key);
}

function generateObjectDefinition(
  doc: Doc,
  item: MddocTypeFieldObject,
  name = item.assertGetName()
) {
  if (generatedTypeCache.has(name)) {
    return name;
  }

  const fields = item.getFields() ?? {};
  const entries: string[] = [];
  for (let key in fields) {
    const definition = fields[key];
    const entryType = getType(doc, definition);
    const separator = definition.getRequired() === true ? ':' : '?:';
    key = shouldEncloseObjectKeyInQuotes(key) ? `"${key}"` : key;
    const entry = `${key}${separator} ${entryType};`;
    entries.push(entry);

    if (isObjectField(definition)) generateObjectDefinition(doc, definition);
    else if (definition instanceof FieldArray && definition.assertGetType() instanceof FieldObject)
      generateObjectDefinition(doc, definition.assertGetType() as MddocTypeFieldObject);
  }

  //   const text = `export type ${name} = {
  // ${entries.join(';\n')}
  // }`;

  doc.appendType(`export type ${name} = {`).startIndentation();
  entries.forEach(entry => doc.appendType(entry));
  doc.endIndentation().appendType('}');
  generatedTypeCache.set(name, true);
  // doc.appendType(text);
  return name;
}

function generateTypesFromEndpoint(doc: Doc, endpoint: MddocTypeHttpEndpoint) {
  // Path paramters
  // const pathParamatersObject = endpoint.getPathParamaters()
  //   ? httpPathParameterToFieldObject(endpoint.assertGetPathParamaters()).setName(
  //       `${endpoint.assertGetName()}PathParameters`
  //     )
  //   : undefined;
  // if (pathParamatersObject) generateObjectDefinition(doc, pathParamatersObject);

  // Query
  // const queryObject = endpoint.getQuery();
  // if (queryObject) {
  //   queryObject.setName(`${endpoint.assertGetName()}Query`);
  //   generateObjectDefinition(doc, queryObject);
  // }

  // Request body
  const requestBodyRaw = endpoint.getRequestBody();
  const requestBodyObject = isObjectField(requestBodyRaw) ? requestBodyRaw : undefined;
  if (requestBodyObject) {
    generateObjectDefinition(doc, requestBodyObject);
  }

  // Request headers
  // const requestHeaders = endpoint.getRequestHeaders();
  // const requestHeadersObject = endpoint.getRequestHeaders()
  //   ? httpHeadersToFieldObject(endpoint.assertGetRequestHeaders().assertGetItems())
  //   : undefined;

  // if (requestHeaders === mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  //   requestHeadersObject?.setName('HTTPRequestHeadersWithAuthAndJSONContentType');
  // if (requestHeaders === mddocEndpointHttpHeaderItems.authRequestHeaders)
  //   requestHeadersObject?.setName('HTTPRequestHeadersWithAuth');
  // // Is custom header, name after endpoint
  // else requestHeadersObject?.setName(`${endpoint.assertGetName()}RequestHeaders`);

  // if (requestHeadersObject) generateObjectDefinition(doc, requestHeadersObject);

  // Success response body
  const successResponse = endpoint
    .getResponses()
    ?.find(response => response.getStatusCode() === mddocEndpointStatusCodes.success);
  const successResponseBody = successResponse?.getResponseBody();
  const successResponseBodyObject = isObjectField(successResponseBody)
    ? successResponseBody
    : undefined;
  if (successResponseBodyObject) generateObjectDefinition(doc, successResponseBodyObject);

  // Success response headers
  const successResponseHeaders = successResponse?.getResponseHeaders();
  const successResponseHeadersObject = successResponse?.getResponseHeaders()
    ? httpHeadersToFieldObject(successResponse.assertGetResponseHeaders().assertGetItems())
    : undefined;

  if (successResponseHeaders === mddocEndpointHttpHeaderItems.jsonResponseHeaders)
    successResponseHeadersObject?.setName('HTTPResponseHeadersWithJSONContentType');
  else {
    // Is custom response header, name after endpoint
    successResponseHeadersObject?.setName(`${endpoint.assertGetName()}ResponseHeaders`);
  }

  if (successResponseHeadersObject) generateObjectDefinition(doc, successResponseHeadersObject);

  // TODO: support custom error responses. Currently all error responses follow
  // same order so we don't need it.

  // const errorResponse = endpoint
  //   .getResponses()
  //   ?.find(response => response.getStatusCode() === mddocEndpointStatusCodes.error);
  // const errorResponseBody = errorResponse?.getResponseBody();
  // if (errorResponseBody) {
  //   assert(isObjectField(errorResponseBody));
  //   generateObjectDefinition(doc, errorResponseBody);
  // }

  type SdkEndpointParamsType = {
    // path?: any;
    // query?: any;
    // headers?: any;
    body?: any;
    authToken: MddocTypeFieldString;
  };
  type SdkEndpointResponseType = {
    headers?: any;
    body?: any;
    // statusCode: MddocTypeFieldString;
    // statusText: MddocTypeFieldString;
  };

  const paramsObjectFields: SdkEndpointParamsType = {
    authToken: new FieldString().setDescription('Agent token.'),
  };
  const successObjectFields: SdkEndpointResponseType = {
    // statusCode: new FieldString().setValid([mddocEndpointStatusCodes.success]).setRequired(true),
    // statusText: new FieldString().setRequired(true).setDescription('HTTP response status text'),
  };

  // if (pathParamatersObject) {
  //   if (objectHasRequiredFields(pathParamatersObject)) pathParamatersObject.setRequired(true);
  //   paramsObjectFields.path = pathParamatersObject;
  // }
  // if (queryObject) {
  //   if (objectHasRequiredFields(queryObject)) queryObject.setRequired(true);
  //   paramsObjectFields.query = queryObject;
  // }
  // if (requestHeadersObject) {
  //   if (objectHasRequiredFields(requestHeadersObject)) requestHeadersObject.setRequired(true);
  //   paramsObjectFields.headers = requestHeadersObject;
  // }
  if (requestBodyObject) {
    if (objectHasRequiredFields(requestBodyObject)) requestBodyObject.setRequired(true);
    paramsObjectFields.body = requestBodyObject;
  } else if (isMultipartFormdata(requestBodyRaw)) {
    const formdataObject = requestBodyRaw.assertGetItems();
    if (objectHasRequiredFields(formdataObject)) formdataObject.setRequired(true);
    paramsObjectFields.body = generateObjectDefinition(doc, formdataObject);
  }

  if (successResponseHeadersObject) {
    if (objectHasRequiredFields(successResponseHeadersObject))
      successResponseHeadersObject.setRequired(true);
    successObjectFields.headers = successResponseHeadersObject;
  }
  if (successResponseBodyObject) {
    if (objectHasRequiredFields(successResponseBodyObject))
      successResponseBodyObject.setRequired(true);
    successObjectFields.body = successResponseBodyObject;
  } else if (isFieldBinary(successResponseBody)) {
    successObjectFields.body = successResponseBody.setRequired(true);
  }

  const paramsObject = new FieldObject()
    .setFields(paramsObjectFields)
    .setRequired(true)
    .setName(endpoint.assertGetName() + 'RequestParams');
  const successObject = new FieldObject()
    .setFields(successObjectFields)
    .setRequired(true)
    .setName(endpoint.assertGetName() + 'Result');
  generateObjectDefinition(doc, paramsObject);
  generateObjectDefinition(doc, successObject);

  const text = `export type ${endpoint.assertGetName()} = (params: ${paramsObject.assertGetName()}) => Promise<${successObject.assertGetName()}>`;
  doc.appendEndpoint(text);
}

function documentTypesFromEndpoint(doc: Doc, endpoint: MddocTypeHttpEndpoint) {
  generateTypesFromEndpoint(doc, endpoint);
}

function documentGroupedEndpointTypes(doc: Doc, endpoints: Array<MddocTypeHttpEndpoint>) {
  const apis: Record<string, Record<string, string>> = {};
  endpoints.forEach(next => {
    const [empty, version, group, fnName] = next.assertGetBasePathname().split('/');
    set(apis, `${group}.${fnName}`, next.assertGetName());
  });

  doc.appendEndpoint('export type Endpoints = {').startIndentation();

  for (const groupName in apis) {
    const group = apis[groupName];
    doc.appendEndpoint(`${groupName}: {`).startIndentation();

    for (const fnName in group) {
      const fnType = group[fnName];
      doc.appendEndpoint(`${fnName}: ${fnType};`);
    }

    doc.endIndentation().appendEndpoint('}');
  }

  doc.endIndentation().appendEndpoint('}');
}

function generateGroupedEndpointCode(doc: Doc, endpoints: Array<MddocTypeHttpEndpoint>) {
  const apis: Record<string, Record<string, string>> = {};
  endpoints.forEach(next => {
    const [empty, version, group, fnName] = next.assertGetBasePathname().split('/');
    set(apis, `${group}.${fnName}`, next.assertGetName());
  });

  doc.appendEndpoint('export type Endpoints = {').startIndentation();

  for (const groupName in apis) {
    const group = apis[groupName];
    doc.appendEndpoint(`${groupName}: {`).startIndentation();

    for (const fnName in group) {
      const fnType = group[fnName];
      doc.appendEndpoint(`${fnName}: ${fnType};`);
    }

    doc.endIndentation().appendEndpoint('}');
  }

  doc.endIndentation().appendEndpoint('}');
}

async function main() {
  const endpointsDir = './sdk/js-sdk/v1/src';
  const filename = path.normalize(endpointsDir + '/types.ts');
  const doc = new Doc();

  documentTypesFromEndpoint(doc, readFileEndpointDefinition);
  documentTypesFromEndpoint(doc, addWorkspaceEndpointDefinition);
  documentTypesFromEndpoint(doc, addPermissionItemsEndpointDefinition);

  documentGroupedEndpointTypes(doc, [
    readFileEndpointDefinition,
    addWorkspaceEndpointDefinition,
    addPermissionItemsEndpointDefinition,
  ]);

  fse.ensureFileSync(filename);
  return fse.writeFile(filename, doc.compileText(), {encoding: 'utf-8'});
}

main()
  .then(() => console.log('mddoc gen js sdk complete'))
  .catch(console.error.bind(console));

// TODO: endpoint type from code then generated endpoint type
// TODO: gen endpoint code
// TODO: type and field comments
// TODO: gen validation schemas
// TODO: gen tests
// TODO: some fields that are required are coming out not required bcos it's not set
// TODO: endpoint type, result should have headers and body, and error thrown should have headers and body
// TODO: required types
