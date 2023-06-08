import {execSync} from 'child_process';
import * as fse from 'fs-extra';
import {compact, forEach, last, nth, set, uniq, upperFirst} from 'lodash';
import {
  AppExportedHttpEndpoints,
  getFimidaraPrivateHttpEndpoints,
  getFimidaraPublicHttpEndpoints,
} from '../endpoints/endpoints';
import {isObjectEmpty} from '../utils/fns';
import {
  FieldObject,
  MddocTypeFieldArray,
  MddocTypeFieldBinary,
  MddocTypeFieldBoolean,
  MddocTypeFieldDate,
  MddocTypeFieldNull,
  MddocTypeFieldNumber,
  MddocTypeFieldObject,
  MddocTypeFieldOrCombination,
  MddocTypeFieldString,
  MddocTypeFieldUndefined,
  MddocTypeHttpEndpoint,
  isMddocFieldArray,
  isMddocFieldBinary,
  isMddocFieldBoolean,
  isMddocFieldDate,
  isMddocFieldNull,
  isMddocFieldNumber,
  isMddocFieldObject,
  isMddocFieldOrCombination,
  isMddocFieldString,
  isMddocFieldUndefined,
  isMddocMultipartFormdata,
  objectHasRequiredFields,
} from './mddoc';
import path = require('path');

class Doc {
  protected disclaimer =
    '// This file is auto-generated, do not modify directly. \n' +
    '// Reach out to @abayomi to suggest changes.\n';
  protected endpointsText = '';
  protected typesText = '';
  protected docImports: Record<string, {importing: string[]; from: string}> = {};
  protected classes: Record<string, {entries: string[]; name: string; extendsName?: string}> = {};

  generatedTypeCache: Map<string, boolean> = new Map();

  constructor(protected genTypesFilename: string) {}

  appendType(typeText: string) {
    this.typesText += typeText + '\n';
    return this;
  }

  appendEndpoint(endpoint: string) {
    this.endpointsText += endpoint + '\n';
    return this;
  }

  appendImport(importing: Array<string>, from: string) {
    let entry = this.docImports[from];
    if (!entry) {
      entry = {from, importing};
      this.docImports[from] = entry;
    } else {
      entry.importing = uniq(entry.importing.concat(importing));
    }

    return this;
  }

  appendImportFromGenTypes(importing: string[]) {
    return this.appendImport(importing, this.genTypesFilename);
  }

  appendToClass(entry: string, name: string, extendsName?: string) {
    let classEntry = this.classes[name];
    if (!classEntry) {
      classEntry = {name, extendsName, entries: [entry]};
      this.classes[name] = classEntry;
    } else {
      if (extendsName && extendsName !== classEntry.extendsName)
        classEntry.extendsName = extendsName;
      classEntry.entries.push(entry);
    }

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
      this.endpointsText +
      '\n' +
      this.compileClasses()
    );
  }

  protected compileImports() {
    let importsText = '';
    for (const from in this.docImports) {
      const {importing} = this.docImports[from];
      importsText += `import {${importing.join(', ')}} from "${from}"\n`;
    }
    return importsText;
  }

  protected compileClasses() {
    let classesText = '';
    for (const name in this.classes) {
      const {entries, extendsName} = this.classes[name];
      const extendsText = extendsName ? ` extends ${extendsName}` : '';
      classesText += `export class ${name}${extendsText} {\n`;
      entries.forEach(fieldEntry => {
        classesText += `  ${fieldEntry}\n`;
      });
      classesText += `}\n`;
    }
    return classesText;
  }
}

function getEnumType(doc: Doc, item: MddocTypeFieldString) {
  const name = item.getEnumName();
  if (name && doc.generatedTypeCache.has(name)) {
    return name;
  }

  const text = item
    .assertGetValid()
    .map(next => `"${next}"`)
    .join(' | ');

  if (name) {
    doc.generatedTypeCache.set(name, true);
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
function getNullType(item: MddocTypeFieldNull) {
  return 'null';
}
function getUndefinedType(item: MddocTypeFieldUndefined) {
  return 'undefined';
}
function getDateType(item: MddocTypeFieldDate) {
  return 'number';
}
function getArrayType(doc: Doc, item: MddocTypeFieldArray<any>) {
  const ofType = item.assertGetType();
  const typeString = getType(doc, ofType, /** asFetchResponseIfFieldBinary */ false);
  return `Array<${typeString}>`;
}
function getOrCombinationType(doc: Doc, item: MddocTypeFieldOrCombination) {
  return item
    .assertGetTypes()
    .map(next => getType(doc, next, /** asFetchResponseIfFieldBinary */ false))
    .join(' | ');
}
function getBinaryType(doc: Doc, item: MddocTypeFieldBinary, asFetchResponse: boolean) {
  if (asFetchResponse) {
    doc.appendImport(['Response'], 'cross-fetch');
    return 'Response';
  } else {
    doc.appendImport(['Readable'], 'isomorphic-form-data');
    return 'string | Readable | ReadableStream';
  }
}

function getType(doc: Doc, item: any, asFetchResponseIfFieldBinary: boolean): string {
  if (isMddocFieldString(item)) {
    return getStringType(doc, item);
  } else if (isMddocFieldNumber(item)) {
    return getNumberType(item);
  } else if (isMddocFieldBoolean(item)) {
    return getBooleanType(item);
  } else if (isMddocFieldNull(item)) {
    return getNullType(item);
  } else if (isMddocFieldUndefined(item)) {
    return getUndefinedType(item);
  } else if (isMddocFieldDate(item)) {
    return getDateType(item);
  } else if (isMddocFieldArray(item)) {
    return getArrayType(doc, item);
  } else if (isMddocFieldOrCombination(item)) {
    return getOrCombinationType(doc, item);
  } else if (isMddocFieldBinary(item)) {
    return getBinaryType(doc, item, asFetchResponseIfFieldBinary);
  } else if (isMddocFieldObject(item)) {
    return generateObjectDefinition(doc, item, asFetchResponseIfFieldBinary);
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
  asFetchResponse: boolean,
  name?: string,
  extraFields: string[] = []
) {
  name = name ?? item.assertGetName();
  if (doc.generatedTypeCache.has(name)) {
    return name;
  }

  const fields = item.getFields() ?? {};
  const entries: string[] = [];
  for (let key in fields) {
    const value = fields[key];
    const entryType = getType(doc, value.data, asFetchResponse);
    const separator = value.optional ? '?:' : ':';
    key = shouldEncloseObjectKeyInQuotes(key) ? `"${key}"` : key;
    const entry = `${key}${separator} ${entryType};`;
    entries.push(entry);

    const valueData = value.data;
    if (isMddocFieldObject(valueData)) generateObjectDefinition(doc, valueData, asFetchResponse);
    else if (isMddocFieldArray(valueData) && valueData.assertGetType() instanceof FieldObject)
      generateObjectDefinition(
        doc,
        valueData.assertGetType() as MddocTypeFieldObject,
        asFetchResponse
      );
  }

  doc.appendType(`export type ${name} = {`);
  entries.concat(extraFields).forEach(entry => doc.appendType(entry));
  doc.appendType('}');
  doc.generatedTypeCache.set(name, true);
  return name;
}

function getTypesFromEndpoint(endpoint: MddocTypeHttpEndpoint<any>) {
  // Request body
  const requestBodyRaw = endpoint.getRequestBody();
  const requestBodyObject = isMddocFieldObject(requestBodyRaw)
    ? requestBodyRaw
    : isMddocMultipartFormdata(requestBodyRaw)
    ? requestBodyRaw.assertGetItems()
    : undefined;

  // Success response body
  const successResponseBodyRaw = endpoint.getResponseBody();
  const successResponseBodyObject = isMddocFieldObject(successResponseBodyRaw)
    ? successResponseBodyRaw
    : undefined;

  // Success response headers
  const successResponseHeadersObject = endpoint.getResponseHeaders();

  type SdkEndpointResponseType = {
    body?: any;
  };

  const successObjectFields: SdkEndpointResponseType = {};
  const requestBodyObjectHasRequiredFields =
    requestBodyObject && objectHasRequiredFields(requestBodyObject);

  if (successResponseBodyObject) {
    if (objectHasRequiredFields(successResponseBodyObject))
      successObjectFields.body = FieldObject.requiredField(successResponseBodyObject);
    else successObjectFields.body = FieldObject.optionalField(successResponseBodyObject);
  } else if (isMddocFieldBinary(successResponseBodyRaw)) {
    successObjectFields.body = FieldObject.requiredField(successResponseBodyRaw);
  }

  return {
    requestBodyRaw,
    requestBodyObject,
    successResponseBodyRaw,
    successResponseBodyObject,
    successResponseHeadersObject,
    requestBodyObjectHasRequiredFields,
  };
}

function generateTypesFromEndpoint(doc: Doc, endpoint: MddocTypeHttpEndpoint<any>) {
  const {requestBodyObject, successResponseBodyObject} = getTypesFromEndpoint(endpoint);

  // Request body
  if (requestBodyObject) generateObjectDefinition(doc, requestBodyObject, false);

  // Success response body
  if (successResponseBodyObject) {
    generateObjectDefinition(doc, successResponseBodyObject, /** asFetchResponse */ true);
  }
}

function documentTypesFromEndpoint(doc: Doc, endpoint: MddocTypeHttpEndpoint<any>) {
  generateTypesFromEndpoint(doc, endpoint);
}

function generateEndpointCode(
  doc: Doc,
  types: ReturnType<typeof getTypesFromEndpoint>,
  className: string,
  fnName: string,
  endpoint: MddocTypeHttpEndpoint<any>
) {
  const {
    requestBodyObject,
    successResponseBodyRaw,
    successResponseBodyObject,
    requestBodyRaw,
    requestBodyObjectHasRequiredFields,
  } = types;

  doc.appendImportFromGenTypes(
    compact([requestBodyObject?.assertGetName(), successResponseBodyObject?.assertGetName()])
  );

  let resultTypeName = 'undefined';
  if (successResponseBodyObject) {
    doc.appendImportFromGenTypes([successResponseBodyObject.assertGetName()]);
    resultTypeName = successResponseBodyObject.assertGetName();
  } else if (isMddocFieldBinary(successResponseBodyRaw)) {
    resultTypeName = getBinaryType(doc, successResponseBodyRaw, true);
  }

  const requestBodyObjectName = requestBodyObject?.assertGetName();
  const endpointParamsText = requestBodyObject
    ? requestBodyObjectHasRequiredFields
      ? `props: FimidaraEndpointParamsRequired<${requestBodyObjectName}>`
      : `props?: FimidaraEndpointParamsOptional<${requestBodyObjectName}>`
    : 'props?: FimidaraEndpointParamsOptional<undefined>';
  const bodyText = isMddocMultipartFormdata(requestBodyRaw)
    ? 'formdata: props.body,'
    : requestBodyObject
    ? 'data: props?.body,'
    : '';
  const text = `${fnName} = async (${endpointParamsText}): Promise<FimidaraEndpointResult<${resultTypeName}>> => {
    return this.execute${isMddocFieldBinary(successResponseBodyRaw) ? 'Raw' : 'Json'}({
      ${bodyText}
      path: "${endpoint.assertGetBasePathname()}",
      method: "${endpoint.assertGetMethod().toUpperCase()}"
    }, props);
  }`;

  doc.appendToClass(text, className, 'FimidaraEndpointsBase');
}

function generateEveryEndpointCode(doc: Doc, endpoints: Array<MddocTypeHttpEndpoint<any>>) {
  const leafEndpointsMap: Record<
    string,
    Record<
      string,
      {endpoint: MddocTypeHttpEndpoint<any>; types: ReturnType<typeof getTypesFromEndpoint>}
    >
  > = {};
  const branchMap: Record<
    string,
    Record<string, Record<string, /** Record<string, any...> */ any>>
  > = {};

  endpoints.forEach(e1 => {
    const [empty, version, ...rest] = e1.assertGetBasePathname().split('/');

    const fnName = last(rest);
    const groupName = rest.length > 1 ? nth(rest, rest.length - 2) : 'fimidara';
    const className = `${upperFirst(groupName)}Endpoints`;
    const types = getTypesFromEndpoint(e1);
    const key = `${className}.${fnName}`;
    set(leafEndpointsMap, key, {types, endpoint: e1});

    const branches = rest.slice(0, -1);
    const branchesKey = branches.join('.');
    set(branchMap, branchesKey, {});
  });

  doc.appendImport(
    [
      'invokeEndpoint',
      'FimidaraEndpointsBase',
      'FimidaraEndpointResult',
      'FimidaraEndpointParamsRequired',
      'FimidaraEndpointParamsOptional',
    ],
    './utils'
  );

  for (const groupName in leafEndpointsMap) {
    const group = leafEndpointsMap[groupName];

    for (const fnName in group) {
      const {types, endpoint} = group[fnName];
      generateEndpointCode(doc, types, groupName, fnName, endpoint);
    }
  }

  function docBranch(parentName: string, ownName: string, branch: Record<string, any>) {
    if (!isObjectEmpty(branch)) {
      forEach(branch, (b1, bName) => {
        docBranch(ownName, bName, b1);
      });
    }

    doc.appendToClass(
      `${ownName} = new ${upperFirst(ownName)}Endpoints(this.config, this);`,
      `${upperFirst(parentName)}Endpoints`,
      'FimidaraEndpointsBase'
    );
  }

  for (const ownName in branchMap) {
    docBranch('fimidara', ownName, branchMap[ownName]);
  }
}

function uniqEnpoints(endpoints: Array<MddocTypeHttpEndpoint<any>>) {
  const endpointNameMap: Record<string, string> = {};

  endpoints.forEach(e1 => {
    const names = e1.assertGetBasePathname().split('/');
    const fnName = last(names);
    const method = e1.assertGetMethod().toLowerCase();
    const key = `${fnName}__${method}`;
    endpointNameMap[key] = key;
  });

  return endpoints.filter(e1 => {
    const names = e1.assertGetBasePathname().split('/');
    const fnName = last(names);
    const method = e1.assertGetMethod().toLowerCase();
    const ownKey = `${fnName}__${method}`;
    const postKey = `${fnName}__post`;
    const getKey = `${fnName}__get`;

    if (ownKey === getKey && endpointNameMap[postKey]) {
      return false;
    }

    return true;
  });
}

async function jsSdkCodeGen(endpoints: AppExportedHttpEndpoints, filenamePrefix: string) {
  const endpointsDir = './sdk/js-sdk/v1/src';
  const typesFilename = `${filenamePrefix}Types`;
  const typesFilepath = path.normalize(endpointsDir + '/' + typesFilename + '.ts');
  const codesFilepath = path.normalize(endpointsDir + `/${filenamePrefix}Endpoints.ts`);
  const typesDoc = new Doc('./' + typesFilename);
  const codesDoc = new Doc('./' + typesFilename);

  forEach(endpoints, e1 => {
    if (e1) documentTypesFromEndpoint(typesDoc, e1.mddocHttpDefinition);
  });

  const httpEndpoints = endpoints.map(e1 => e1.mddocHttpDefinition);
  const uniqHttpEndpoints = uniqEnpoints(httpEndpoints);
  generateEveryEndpointCode(codesDoc, uniqHttpEndpoints);

  fse.ensureFileSync(typesFilepath);
  fse.ensureFileSync(codesFilepath);
  await Promise.all([
    fse.writeFile(typesFilepath, typesDoc.compileText(), {encoding: 'utf-8'}),
    fse.writeFile(codesFilepath, codesDoc.compileText(), {encoding: 'utf-8'}),
  ]);

  execSync(`npx --yes prettier --write "${typesFilepath}"`, {stdio: 'inherit'});
  execSync(`npx --yes prettier --write "${codesFilepath}"`, {stdio: 'inherit'});
}

async function main() {
  await Promise.all([
    jsSdkCodeGen(getFimidaraPublicHttpEndpoints() as any, 'public'),
    jsSdkCodeGen(getFimidaraPrivateHttpEndpoints() as any, 'private'),
  ]);
}

main()
  .then(() => console.log('mddoc gen js sdk complete'))
  .catch(console.error.bind(console));
