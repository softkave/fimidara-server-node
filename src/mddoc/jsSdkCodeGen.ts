import assert from 'assert';
import {execSync} from 'child_process';
import fse from 'fs-extra';
import {compact, forEach, last, nth, set, uniq, upperFirst} from 'lodash-es';
import path from 'path';
import {AnyObject} from 'softkave-js-utils';
import {globalDispose} from '../contexts/globalUtils.js';
import {kIjxUtils} from '../contexts/ijx/injectables.js';
import {registerIjxUtils} from '../contexts/ijx/register.js';
import {
  AppExportedHttpEndpoints,
  getFimidaraHttpEndpoints,
} from '../endpoints/endpoints.js';
import {kEndpointTag} from '../endpoints/types.js';
import {
  kFimidaraConfigDbType,
  kFimidaraConfigQueueProvider,
} from '../resources/config.js';
import {isObjectEmpty, pathSplit} from '../utils/fns.js';
import {
  FieldArrayType,
  FieldBinaryType,
  FieldBooleanType,
  FieldDateType,
  FieldNullType,
  FieldNumberType,
  FieldObjectType,
  FieldOrCombinationType,
  FieldStringType,
  FieldUndefinedType,
  HttpEndpointDefinitionType,
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
  isMddocSdkParamsBody,
  mddocConstruct,
  objectHasRequiredFields,
} from './mddoc.js';
import {filterEndpoints} from './utils.js';

class Doc {
  protected disclaimer =
    '// This file is auto-generated, do not modify directly. \n' +
    '// Reach out to @abayomi to suggest changes.\n';
  protected endpointsText = '';
  protected typesText = '';
  protected docImports: Record<string, {importing: string[]; from: string}> =
    {};
  protected docTypeImports: Record<
    string,
    {importing: string[]; from: string}
  > = {};
  protected classes: Record<
    string,
    {entries: string[]; name: string; extendsName?: string}
  > = {};

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

  appendTypeImport(importing: Array<string>, from: string) {
    let entry = this.docTypeImports[from];

    if (!entry) {
      entry = {from, importing};
      this.docTypeImports[from] = entry;
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
      if (extendsName && extendsName !== classEntry.extendsName) {
        classEntry.extendsName = extendsName;
      }

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
      this.compileTypeImports() +
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

  protected compileTypeImports() {
    let importsText = '';

    for (const from in this.docTypeImports) {
      const {importing} = this.docTypeImports[from];
      importsText += `import type {${importing.join(', ')}} from "${from}"\n`;
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
      classesText += '}\n';
    }

    return classesText;
  }
}

function getEnumType(doc: Doc, item: FieldStringType) {
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
function getStringType(doc: Doc, item: FieldStringType) {
  return item.getValid()?.length ? getEnumType(doc, item) : 'string';
}
function getNumberType(item: FieldNumberType) {
  return 'number';
}
function getBooleanType(item: FieldBooleanType) {
  return 'boolean';
}
function getNullType(item: FieldNullType) {
  return 'null';
}
function getUndefinedType(item: FieldUndefinedType) {
  return 'undefined';
}
function getDateType(item: FieldDateType) {
  return 'number';
}
function getArrayType(doc: Doc, item: FieldArrayType<any>) {
  const ofType = item.assertGetType();
  const typeString = getType(
    doc,
    ofType,
    /** asFetchResponseIfFieldBinary */ false
  );
  return `Array<${typeString}>`;
}
function getOrCombinationType(doc: Doc, item: FieldOrCombinationType) {
  return item
    .assertGetTypes()
    .map(next => getType(doc, next, /** asFetchResponseIfFieldBinary */ false))
    .join(' | ');
}
function getBinaryType(
  doc: Doc,
  item: FieldBinaryType,
  asFetchResponse: boolean
) {
  if (asFetchResponse) {
    doc.appendTypeImport(['Readable'], 'stream');
    return 'Blob | Readable';
  } else {
    doc.appendTypeImport(['Readable'], 'stream');
    return 'string | Readable | Blob | Buffer';
  }
}

function getType(
  doc: Doc,
  item: any,
  asFetchResponseIfFieldBinary: boolean
): string {
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
  item: FieldObjectType<any> | FieldObjectType<AnyObject>,
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
    const separator = value.required ? ':' : '?:';
    key = shouldEncloseObjectKeyInQuotes(key) ? `"${key}"` : key;
    const entry = `${key}${separator} ${entryType};`;
    entries.push(entry);

    const valueData = value.data;
    if (isMddocFieldObject(valueData))
      generateObjectDefinition(doc, valueData, asFetchResponse);
    else if (
      isMddocFieldArray(valueData) &&
      isMddocFieldObject(valueData.assertGetType())
    )
      generateObjectDefinition(
        doc,
        valueData.assertGetType() as FieldObjectType<any>,
        asFetchResponse
      );
  }

  doc.appendType(`export type ${name} = {`);
  entries.concat(extraFields).forEach(entry => doc.appendType(entry));
  doc.appendType('}');
  doc.generatedTypeCache.set(name, true);
  return name;
}

function getTypesFromEndpoint(endpoint: HttpEndpointDefinitionType) {
  // Request body
  const sdkRequestBodyRaw =
    endpoint.getSdkParamsBody() ?? endpoint.getRequestBody();
  const sdkRequestObject = isMddocFieldObject(sdkRequestBodyRaw)
    ? sdkRequestBodyRaw
    : isMddocMultipartFormdata(sdkRequestBodyRaw)
      ? sdkRequestBodyRaw.assertGetItems()
      : isMddocSdkParamsBody(sdkRequestBodyRaw)
        ? sdkRequestBodyRaw.assertGetDef()
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
    sdkRequestObject && objectHasRequiredFields(sdkRequestObject);

  if (successResponseBodyObject) {
    if (objectHasRequiredFields(successResponseBodyObject))
      successObjectFields.body = mddocConstruct.constructFieldObjectField(
        true,
        successResponseBodyObject
      );
    else
      successObjectFields.body = mddocConstruct.constructFieldObjectField(
        false,
        successResponseBodyObject
      );
  } else if (isMddocFieldBinary(successResponseBodyRaw)) {
    successObjectFields.body = mddocConstruct.constructFieldObjectField(
      true,
      successResponseBodyRaw
    );
  }

  return {
    sdkRequestBodyRaw,
    sdkRequestObject,
    successResponseBodyRaw,
    successResponseBodyObject,
    successResponseHeadersObject,
    requestBodyObjectHasRequiredFields,
  };
}

function generateTypesFromEndpoint(
  doc: Doc,
  endpoint: HttpEndpointDefinitionType
) {
  const {sdkRequestObject: requestBodyObject, successResponseBodyObject} =
    getTypesFromEndpoint(endpoint);

  // Request body
  if (requestBodyObject) {
    generateObjectDefinition(doc, requestBodyObject, false);
  }

  // Success response body
  if (successResponseBodyObject) {
    generateObjectDefinition(
      doc,
      successResponseBodyObject,
      /** asFetchResponse */ true
    );
  }
}

function documentTypesFromEndpoint(
  doc: Doc,
  endpoint: HttpEndpointDefinitionType
) {
  generateTypesFromEndpoint(doc, endpoint);
}

function decideIsBinaryRequest(
  req: ReturnType<typeof getTypesFromEndpoint>['sdkRequestBodyRaw']
) {
  return (
    isMddocMultipartFormdata(req) ||
    (isMddocSdkParamsBody(req) && req.serializeAs === 'formdata')
  );
}

function generateEndpointCode(
  doc: Doc,
  types: ReturnType<typeof getTypesFromEndpoint>,
  className: string,
  fnName: string,
  endpoint: HttpEndpointDefinitionType
) {
  const {
    sdkRequestObject,
    successResponseBodyRaw,
    successResponseBodyObject,
    sdkRequestBodyRaw: requestBodyRaw,
    requestBodyObjectHasRequiredFields,
  } = types;

  doc.appendImportFromGenTypes(
    compact([
      sdkRequestObject?.assertGetName(),
      successResponseBodyObject?.assertGetName(),
    ])
  );

  let param0 = '';
  let resultType = 'void';
  let templateParams = '';
  let param1 = 'opts?: FimidaraEndpointOpts';

  const isBinaryRequest = decideIsBinaryRequest(requestBodyRaw);
  const isBinaryResponse = isMddocFieldBinary(successResponseBodyRaw);
  const requestBodyObjectName = sdkRequestObject?.assertGetName();

  if (successResponseBodyObject) {
    doc.appendImportFromGenTypes([successResponseBodyObject.assertGetName()]);
    resultType = successResponseBodyObject.assertGetName();
  } else if (isBinaryResponse) {
    resultType = 'FimidaraEndpointResultWithBinaryResponse<TResponseType>';
  }

  if (sdkRequestObject) {
    if (requestBodyObjectHasRequiredFields) {
      param0 = `props: ${requestBodyObjectName}`;
    } else {
      param0 = `props?: ${requestBodyObjectName}`;
    }
  }

  const bodyText: string[] = [];
  let mapping = '';
  const sdkBody = endpoint.getSdkParamsBody();

  if (isBinaryResponse) {
    bodyText.push('responseType: opts.responseType,');
    templateParams = "<TResponseType extends 'blob' | 'stream'>";
    param1 =
      'opts: FimidaraEndpointDownloadBinaryOpts<TResponseType> ' +
      '= {responseType: "blob"} as FimidaraEndpointDownloadBinaryOpts<TResponseType>';
  }

  if (isBinaryRequest) {
    bodyText.push('formdata: props,');
    param1 = 'opts?: FimidaraEndpointUploadBinaryOpts';
  } else if (sdkRequestObject) {
    bodyText.push('data: props,');
  }

  if (sdkRequestObject && sdkBody) {
    forEach(sdkRequestObject.fields ?? {}, (value, key) => {
      const mapTo = sdkBody.mappings(key);

      if (mapTo) {
        const entry = `"${key}": ["${mapTo[0]}", "${String(mapTo[1])}"],`;
        mapping += entry;
      }
    });

    if (mapping.length) {
      mapping = `{${mapping}}`;
    }
  }

  const params = compact([param0, param1]).join(',');
  const text = `${fnName} = async ${templateParams}(${params}): Promise<${resultType}> => {
    ${mapping.length ? `const mapping = ${mapping} as const` : ''}
    return this.execute${isBinaryResponse ? 'Raw' : 'Json'}({
      ${bodyText.join('')}
      path: "${endpoint.assertGetBasePathname()}",
      method: "${endpoint.assertGetMethod().toUpperCase()}",
    }, opts, ${mapping.length ? 'mapping' : ''});
  }`;

  doc.appendToClass(text, className, 'FimidaraEndpointsBase');
}

function generateEveryEndpointCode(
  doc: Doc,
  endpoints: Array<HttpEndpointDefinitionType>
) {
  const leafEndpointsMap: Record<
    string,
    Record<
      string,
      {
        endpoint: HttpEndpointDefinitionType;
        types: ReturnType<typeof getTypesFromEndpoint>;
      }
    >
  > = {};
  const branchMap: Record<
    string,
    Record<string, Record<string, /** Record<string, any...> */ any>>
  > = {};

  endpoints.forEach(e1 => {
    const pathname = e1.assertGetBasePathname();
    // pathname looks like /v1/agentToken/addAgentToken, which should yield 4
    // parts, but pathSplit, removes empty strings, so we'll have ["v1",
    // "agentToken", "addAgentToken"]. also filter out path params.
    const [, ...rest] = pathSplit(pathname).filter(p => !p.startsWith(':'));

    assert(rest.length >= 2);
    const fnName = last(rest);
    const groupName = nth(rest, rest.length - 2);
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
      'FimidaraEndpointsBase',
      'FimidaraEndpointResultWithBinaryResponse',
      'FimidaraEndpointOpts',
      'FimidaraEndpointDownloadBinaryOpts',
      'FimidaraEndpointUploadBinaryOpts',
    ],
    './endpointImports.ts'
  );

  for (const groupName in leafEndpointsMap) {
    const group = leafEndpointsMap[groupName];

    for (const fnName in group) {
      const {types, endpoint} = group[fnName];
      generateEndpointCode(doc, types, groupName, fnName, endpoint);
    }
  }

  function docBranch(
    parentName: string,
    ownName: string,
    branch: Record<string, any>
  ) {
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

function uniqEnpoints(endpoints: Array<HttpEndpointDefinitionType>) {
  const endpointNameMap: Record<string, string> = {};

  endpoints.forEach(e1 => {
    const names = pathSplit(e1.assertGetBasePathname());
    const fnName = last(names);
    const method = e1.assertGetMethod().toLowerCase();
    const key = `${fnName}__${method}`;
    endpointNameMap[key] = key;
  });

  return endpoints.filter(e1 => {
    const names = pathSplit(e1.assertGetBasePathname());
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

async function jsSdkCodeGen(
  endpoints: AppExportedHttpEndpoints,
  filenamePrefix: string,
  tags: string[]
) {
  const endpointsDir = './sdk/js-sdk/src/endpoints';
  const typesFilename = `${filenamePrefix}Types.ts`;
  const typesFilepath = path.normalize(endpointsDir + '/' + typesFilename);
  const codesFilepath = path.normalize(
    endpointsDir + `/${filenamePrefix}Endpoints.ts`
  );
  const typesDoc = new Doc('./' + typesFilename);
  const codesDoc = new Doc('./' + typesFilename);

  const pickedEndpoints = filterEndpoints(endpoints, tags);

  forEach(pickedEndpoints, e1 => {
    if (e1) {
      documentTypesFromEndpoint(
        typesDoc,
        e1.mddocHttpDefinition as unknown as HttpEndpointDefinitionType
      );
    }
  });

  const httpEndpoints = pickedEndpoints.map(e1 => e1.mddocHttpDefinition);
  const uniqHttpEndpoints = uniqEnpoints(
    httpEndpoints as unknown as Array<HttpEndpointDefinitionType>
  );
  generateEveryEndpointCode(codesDoc, uniqHttpEndpoints);

  fse.ensureFileSync(typesFilepath);
  fse.ensureFileSync(codesFilepath);
  await Promise.all([
    fse.writeFile(typesFilepath, typesDoc.compileText(), {encoding: 'utf-8'}),
    fse.writeFile(codesFilepath, codesDoc.compileText(), {encoding: 'utf-8'}),
  ]);

  execSync(`npx code-migration-helpers add-ext -f="${endpointsDir}"`, {
    stdio: 'inherit',
  });
  execSync(`npx --yes prettier --write "${typesFilepath}"`, {stdio: 'inherit'});
  execSync(`npx --yes prettier --write "${codesFilepath}"`, {stdio: 'inherit'});
}

async function main() {
  await registerIjxUtils({
    dbType: kFimidaraConfigDbType.noop,
    queueProvider: kFimidaraConfigQueueProvider.memory,
    pubSubProvider: kFimidaraConfigQueueProvider.memory,
    redlockProvider: kFimidaraConfigQueueProvider.memory,
    cacheProvider: kFimidaraConfigQueueProvider.memory,
    dsetProvider: kFimidaraConfigQueueProvider.memory,
    redisURL: '',
  });

  await Promise.all([
    jsSdkCodeGen(
      getFimidaraHttpEndpoints() as any,
      /** filenamePrefix */ 'public',
      [kEndpointTag.public]
    ),
    jsSdkCodeGen(
      getFimidaraHttpEndpoints() as any,
      /** filenamePrefix */ 'private',
      [kEndpointTag.private]
    ),
  ]);
}

main()
  .then(() => kIjxUtils.logger().log('mddoc gen js sdk complete'))
  .catch(err => kIjxUtils.logger().error(err))
  .finally(() => globalDispose());
