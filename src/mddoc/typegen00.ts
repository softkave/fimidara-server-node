import * as fse from 'fs-extra';
import {set, uniq, upperFirst} from 'lodash';
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
  isMddocFieldBinary,
  isMddocFieldObject,
  isMddocMultipartFormdata,
  objectHasRequiredFields,
} from './mddoc';
import path = require('path');

type DocAppendOptions = {
  skipIndentation?: boolean;
};

class Doc {
  protected disclaimer =
    '// This file is auto-generated, do not modify directly. \n' +
    '// Reach out to @abayomi to suggest changes.\n';
  protected endpointsText = '';
  protected typesText = '';
  protected docImports: Record<string, {importing: string[]; from: string}> = {};
  protected indentationCount = 0;

  appendType(typeText: string, opts: DocAppendOptions = {}) {
    this.typesText += this.getLineIndentation(opts) + typeText + '\n';
    return this;
  }

  appendEndpoint(endpoint: string, opts: DocAppendOptions = {}) {
    this.endpointsText += this.getLineIndentation(opts) + endpoint + '\n';
    return this;
  }

  appendImport(importing: string[], from: string) {
    let entry = this.docImports[from];
    if (!entry) {
      entry = {from, importing};
      this.docImports[from] = entry;
    } else {
      entry.importing = uniq(entry.importing.concat(importing));
    }

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
      this.disclaimer +
      '\n' +
      this.compileImports() +
      '\n' +
      this.typesText +
      '\n' +
      this.endpointsText
    );
  }

  protected getLineIndentation(opts: DocAppendOptions) {
    if (opts.skipIndentation) return '';
    return this.indentationCount
      ? new Array(this.indentationCount + 1).fill(undefined).join('  ')
      : '';
  }

  protected compileImports() {
    let importsText = '';
    for (const from in this.docImports) {
      const {importing} = this.docImports[from];
      importsText += `import {${importing.join(', ')}} from "${from}"\n`;
    }
    return importsText;
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
function getBinaryType(doc: Doc, item: MddocTypeFieldBinary) {
  doc.appendImport(['Readable'], 'isomorphic-form-data');
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
    return getBinaryType(doc, item);
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
  name?: string,
  extraFields: string[] = []
) {
  name = name ?? item.assertGetName();
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

    if (isMddocFieldObject(definition)) generateObjectDefinition(doc, definition);
    else if (definition instanceof FieldArray && definition.assertGetType() instanceof FieldObject)
      generateObjectDefinition(doc, definition.assertGetType() as MddocTypeFieldObject);
  }

  doc.appendType(`export type ${name} = {`).startIndentation();
  entries.concat(extraFields).forEach(entry => doc.appendType(entry));
  doc.endIndentation().appendType('}');
  generatedTypeCache.set(name, true);
  return name;
}

function getTypesFromEndpoint(endpoint: MddocTypeHttpEndpoint) {
  // Request body
  const requestBodyRaw = endpoint.getRequestBody();
  const requestBodyObject = isMddocFieldObject(requestBodyRaw) ? requestBodyRaw : undefined;
  const requestFormdataObject = isMddocMultipartFormdata(requestBodyRaw)
    ? requestBodyRaw.assertGetItems()
    : undefined;

  // Success response body
  const successResponse = endpoint
    .getResponses()
    ?.find(response => response.getStatusCode() === mddocEndpointStatusCodes.success);
  const successResponseBodyRaw = successResponse?.getResponseBody();
  const successResponseBodyObject = isMddocFieldObject(successResponseBodyRaw)
    ? successResponseBodyRaw
    : undefined;

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

  type SdkEndpointParamsType = {
    body?: any;
    authToken: MddocTypeFieldString;
  };
  type SdkEndpointResponseType = {
    // headers?: any;
    body?: any;
  };

  const paramsObjectFields: SdkEndpointParamsType = {
    authToken: FieldString.construct().setDescription('Agent token.'),
  };
  const successObjectFields: SdkEndpointResponseType = {};

  if (requestBodyObject) {
    if (objectHasRequiredFields(requestBodyObject)) requestBodyObject.setRequired(true);
    paramsObjectFields.body = requestBodyObject;
  } else if (requestFormdataObject) {
    if (objectHasRequiredFields(requestFormdataObject)) requestFormdataObject.setRequired(true);
    paramsObjectFields.body = requestFormdataObject.assertGetName();
  }

  // if (successResponseHeadersObject) {
  //   if (objectHasRequiredFields(successResponseHeadersObject))
  //     successResponseHeadersObject.setRequired(true);
  //   successObjectFields.headers = successResponseHeadersObject;
  // }
  if (successResponseBodyObject) {
    if (objectHasRequiredFields(successResponseBodyObject))
      successResponseBodyObject.setRequired(true);
    successObjectFields.body = successResponseBodyObject;
  } else if (isMddocFieldBinary(successResponseBodyRaw)) {
    successObjectFields.body = successResponseBodyRaw.setRequired(true);
  }

  const paramsObject = FieldObject.construct()
    .setFields(paramsObjectFields)
    .setRequired(true)
    .setName(endpoint.assertGetName() + 'RequestParams');
  const successObject = FieldObject.construct()
    .setFields(successObjectFields)
    .setRequired(true)
    .setName(endpoint.assertGetName() + 'Result');

  return {
    paramsObject,
    successObject,
    requestBodyRaw,
    requestBodyObject,
    successResponse,
    successResponseBodyRaw,
    successResponseBodyObject,
    successResponseHeadersObject,
    requestFormdataObject,
  };
}

function generateTypesFromEndpoint(doc: Doc, endpoint: MddocTypeHttpEndpoint) {
  const {
    paramsObject,
    successObject,
    requestBodyObject,
    successResponseBodyObject,
    requestFormdataObject,
  } = getTypesFromEndpoint(endpoint);

  // Request body
  if (requestBodyObject) {
    generateObjectDefinition(doc, requestBodyObject);
  } else if (requestFormdataObject) {
    generateObjectDefinition(doc, requestFormdataObject);
  }

  // Success response headers
  // if (successResponseHeadersObject) {
  //   generateObjectDefinition(doc, successResponseHeadersObject);
  // }

  // Success response body
  if (successResponseBodyObject) {
    generateObjectDefinition(doc, successResponseBodyObject);
  }

  generateObjectDefinition(doc, paramsObject);
  generateObjectDefinition(doc, successObject, undefined, [`headers: typeof Headers;`]);
  doc.appendImport(['Headers'], 'cross-fetch');

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
  const apis: Record<
    string,
    Record<
      string,
      {endpoint: MddocTypeHttpEndpoint; types: ReturnType<typeof getTypesFromEndpoint>}
    >
  > = {};
  endpoints.forEach(next => {
    const [empty, version, group, fnName] = next.assertGetBasePathname().split('/');
    set(apis, `${group}.${fnName}`, {endpoint: next, types: getTypesFromEndpoint(next)});
  });
  doc.appendImport(['invokeEndpoint, EndpointsBase'], './utils');

  for (const groupName in apis) {
    const group = apis[groupName];
    doc
      .appendType(`class ${upperFirst(groupName)}Endpoints extends EndpointsBase {`)
      .startIndentation();
    // doc.appendType(`${groupName} = {`).startIndentation();

    for (const fnName in group) {
      const {types, endpoint} = group[fnName];
      const {
        paramsObject,
        requestBodyObject,
        requestFormdataObject,
        successObject,
        successResponseBodyRaw,
      } = types;

      doc.appendImport([paramsObject.assertGetName(), successObject.assertGetName()], './types');
      const text = `${fnName} = async (props: ${paramsObject.assertGetName()}): Promise<${successObject.assertGetName()}> => {
  const response = await invokeEndpoint({
    token: this.getAuthToken(props),
    data: ${requestBodyObject ? 'props.body' : 'undefined'},
    formdata: ${requestFormdataObject ? 'props.body' : 'undefined'},
    path: "${endpoint.assertGetBasePathname()}",
    method: "${endpoint.assertGetMethod().toUpperCase()}"
  });
  const result = {
    headers: response.headers as any,
    body: ${
      isMddocFieldBinary(successResponseBodyRaw) ? 'response.body as any' : 'await response.json()'
    }
  };
  return result;
}`;

      doc.appendType(text, {skipIndentation: true});
    }

    doc.endIndentation().appendType('}');
  }

  doc.appendType('export class FimidaraEndpoints extends EndpointsBase {').startIndentation();
  for (const groupName in apis) {
    doc.appendType(`${groupName} = new ${upperFirst(groupName)}Endpoints(this.config);`);
  }
  doc.endIndentation().appendType('}');
}

async function main() {
  const endpointsDir = './sdk/js-sdk/v1/src';
  const typesFilename = path.normalize(endpointsDir + '/types.ts');
  const codesFilename = path.normalize(endpointsDir + '/endpoints.ts');
  const typesDoc = new Doc();
  const codesDoc = new Doc();

  documentTypesFromEndpoint(typesDoc, readFileEndpointDefinition);
  documentTypesFromEndpoint(typesDoc, addWorkspaceEndpointDefinition);
  documentTypesFromEndpoint(typesDoc, addPermissionItemsEndpointDefinition);

  // documentGroupedEndpointTypes(typesDoc, [
  //   readFileEndpointDefinition,
  //   addWorkspaceEndpointDefinition,
  //   addPermissionItemsEndpointDefinition,
  // ]);

  generateGroupedEndpointCode(codesDoc, [
    readFileEndpointDefinition,
    addWorkspaceEndpointDefinition,
    addPermissionItemsEndpointDefinition,
  ]);

  fse.ensureFileSync(typesFilename);
  return Promise.all([
    fse.writeFile(typesFilename, typesDoc.compileText(), {encoding: 'utf-8'}),
    fse.writeFile(codesFilename, codesDoc.compileText(), {encoding: 'utf-8'}),
  ]);
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
