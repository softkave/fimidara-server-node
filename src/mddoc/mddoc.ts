import {forEach, isString, uniqWith} from 'lodash';
import {
  makeAssertGetAccessor,
  makeClone,
  makeGetAccessor,
  makeSetAccessor,
  withClassAccessors,
} from '../utils/classAccessors';
import {indexArray} from '../utils/indexArray';
import {AnyObject} from '../utils/types';

export const FieldBase = withClassAccessors(
  class FieldBase_ {
    stringType = 'any';
    constructor(public required?: boolean, public description?: string) {}
  }
);

export const FieldString = withClassAccessors(
  class FieldString_ extends FieldBase {
    stringType = 'string';
    constructor(
      required?: boolean,
      description?: string,
      public example?: string,
      public valid?: string[],
      public min?: number,
      public max?: number
    ) {
      super(required, description);
    }
  }
);

export const FieldNumber = withClassAccessors(
  class FieldNumber_ extends FieldBase {
    stringType = 'number';
    constructor(
      required?: boolean,
      description?: string,
      public example?: number,
      public integer?: boolean,
      public min?: number,
      public max?: number
    ) {
      super(required, description);
    }
  }
);

export const FieldBoolean = withClassAccessors(
  class FieldBoolean_ extends FieldBase {
    stringType = 'boolean';
    constructor(required?: boolean, description?: string, public example?: boolean) {
      super(required, description);
    }
  }
);

export const FieldNull = withClassAccessors(
  class FieldNull_ extends FieldBase {
    stringType = 'null';
  }
);

export const FieldUndefined = withClassAccessors(
  class FieldUndefined_ extends FieldBase {
    stringType = 'undefined';
  }
);

export const FieldDate = withClassAccessors(
  class FieldDate_ extends FieldBase {
    stringType = 'iso date string';
    constructor(required?: boolean, description?: string, public example?: string) {
      super(required, description);
    }
  }
);

export const FieldArray = withClassAccessors(
  class FieldArray_ extends FieldBase {
    constructor(
      required?: boolean,
      description?: string,
      public type?: MddocTypeFieldBase,
      public min?: number,
      public max?: number
    ) {
      super(required, description);
      this.stringType = `array of (${type ? type.stringType : 'unknown'})`;
    }

    setType(type?: MddocTypeFieldBase) {
      this.type = type;
      if (type) this.stringType = `array of (${type.stringType})`;
      return this;
    }
  }
);

export type FieldObjectFields<T> = Required<{[K in keyof T]: MddocTypeFieldBase}>;

// TODO: Derive field types from passed object type for extra validation to keep
// API type changes in line with definitions
export class FieldObject<T = AnyObject> extends FieldBase {
  stringType = 'object';
  constructor(
    required?: boolean,
    description?: string,
    public name?: string | undefined,
    public fields?: FieldObjectFields<T>
  ) {
    super(required, description);
    this.stringType = name ?? this.stringType;
  }

  getName = makeGetAccessor(this, 'name');
  assertGetName = makeAssertGetAccessor(this, 'name');
  setName = makeSetAccessor(this, 'name');
  getFields = makeGetAccessor(this, 'fields');
  assertGetFields = makeAssertGetAccessor(this, 'fields');
  setFields = makeSetAccessor(this, 'fields');
  getRequired = makeGetAccessor(this, 'required');
  assertGetRequired = makeAssertGetAccessor(this, 'required');
  setRequired = makeSetAccessor(this, 'required');
  getDescription = makeGetAccessor(this, 'description');
  assertGetDescription = makeAssertGetAccessor(this, 'description');
  setDescription = makeSetAccessor(this, 'description');
  clone = makeClone<typeof FieldObject<T>>(this);
}

export const FieldOrCombination = withClassAccessors(
  class FieldOrCombination_ extends FieldBase {
    constructor(
      required?: boolean,
      description?: string,
      public types?: Array<MddocTypeFieldBase>
    ) {
      super(required, description);
      this.stringType = (types ?? []).map(f => f.stringType).join(' or ');
    }

    setTypes(types?: Array<MddocTypeFieldBase>) {
      this.types = types;
      if (types) this.stringType = types.map(f => f.stringType).join(' or ');
      return this;
    }
  }
);

export const FieldBinary = withClassAccessors(
  class FieldBinary_ extends FieldBase {
    stringType = 'binary';
  }
);

export enum HttpEndpointMethod {
  Get = 'get',
  Post = 'post',
  Delete = 'delete',
}

export const HttpEndpointMultipartFormdata = withClassAccessors(
  class HttpEndpointMultipartFormdata_ {
    constructor(public items?: MddocTypeFieldObject, public isSingularBlob?: boolean) {}
  }
);

export const HttpEndpointHeaderItem = withClassAccessors(
  class HttpEndpointHeaderItem_ {
    constructor(
      public name?: string,
      public type?: MddocTypeFieldString | MddocTypeFieldNumber,
      public required?: boolean,
      public description?: string
    ) {}
  }
);

export const HttpEndpointHeaders = withClassAccessors(
  class HttpEndpointHeaders_ {
    constructor(public items?: Array<MddocTypeHttpEndpointHeaderItem>) {}
  }
);

export const HttpEndpointPathParameterItem = withClassAccessors(
  class HttpEndpointParameterPathnameItem_ {
    constructor(public name?: string, public type?: MddocTypeFieldString) {}
  }
);

export const HttpEndpointResponse = withClassAccessors(
  class HttpEndpointResponse_ {
    constructor(
      public statusCode?: string | number,
      public responseBody?: MddocTypeFieldObject | MddocTypeFieldBinary,
      public responseHeaders?: MddocTypeHttpEndpointHeaders
    ) {}
  }
);

export const HttpEndpointDefinition = withClassAccessors(
  class HttpEndpointDefinition_ {
    constructor(
      public basePathname?: string,
      public method?: HttpEndpointMethod,
      public pathParamaters?: Array<MddocTypeHttpEndpointPathParameterItem>,
      public query?: MddocTypeFieldObject,
      public requestBody?: MddocTypeFieldObject | MddocTypeHttpEndpointMultipartFormdata,
      public requestHeaders?: MddocTypeHttpEndpointHeaders,
      public responses?: Array<MddocTypeHttpEndpointResponse>,
      public name?: string,
      public description?: string
    ) {}
  }
);

export type MddocTypeFieldBase = InstanceType<typeof FieldBase>;
export type MddocTypeFieldString = InstanceType<typeof FieldString>;
export type MddocTypeFieldNumber = InstanceType<typeof FieldNumber>;
export type MddocTypeFieldBoolean = InstanceType<typeof FieldBoolean>;
export type MddocTypeFieldNull = InstanceType<typeof FieldNull>;
export type MddocTypeFieldUndefined = InstanceType<typeof FieldUndefined>;
export type MddocTypeFieldDate = InstanceType<typeof FieldDate>;
export type MddocTypeFieldArray = InstanceType<typeof FieldArray>;
export type MddocTypeFieldObject = InstanceType<typeof FieldObject<AnyObject>>;
export type MddocTypeFieldOrCombination = InstanceType<typeof FieldOrCombination>;
export type MddocTypeFieldBinary = InstanceType<typeof FieldBinary>;
export type MddocTypeHttpEndpoint = InstanceType<typeof HttpEndpointDefinition>;
export type MddocTypeHttpEndpointHeaderItem = InstanceType<typeof HttpEndpointHeaderItem>;
export type MddocTypeHttpEndpointHeaders = InstanceType<typeof HttpEndpointHeaders>;
export type MddocTypeHttpEndpointMultipartFormdata = InstanceType<
  typeof HttpEndpointMultipartFormdata
>;
export type MddocTypeHttpEndpointPathParameterItem = InstanceType<
  typeof HttpEndpointPathParameterItem
>;
export type MddocTypHttpEndpointHeaderItem = InstanceType<typeof HttpEndpointHeaderItem>;
export type MddocTypeHttpEndpointResponse = InstanceType<typeof HttpEndpointResponse>;

export class MdDocumenter {
  static INLINE_SEPARATOR = ' — ';
  static HTML_BREAK = '<br>';
  static NEWLINE = '\n';
  static TAB = '\t';
  static HEADER_TAG = '#';
  static COMMON_MARK_NEWLINE = '\\';

  content = '';

  insertText(text?: string | null): MdDocumenter {
    if (text) this.content += text;
    return this;
  }

  insertHyperlink(text?: string | null, url?: string): MdDocumenter {
    if (text && url) this.content += `[${text}](${url})`;
    return this;
  }

  insertBoldText(text: string): MdDocumenter {
    if (text) {
      this.content += `**${text}**`;
    }
    return this;
  }

  insertInlineCode(text?: string): MdDocumenter {
    if (text) this.content += `\`${text}\``;
    return this;
  }

  insertHeaderTag(level = 1): MdDocumenter {
    while (level > 0) {
      level -= 1;
      this.content += MdDocumenter.HEADER_TAG;
    }
    this.content += ' ';
    return this;
  }

  wrapBoldText(text: string) {
    return text ? `**${text}**` : '';
  }

  wrapInlineCode(text?: string) {
    return text ? `\`${text}\`` : '';
  }

  insertTableCell(text?: string, isStartCell = false): MdDocumenter {
    text = text ?? '';
    this.content += `${isStartCell ? '|' : ''}${text}|`;
    return this;
  }

  insertTableHeaderSeparator(cellCount: number): MdDocumenter {
    for (let i = 0; i < cellCount; i++) {
      this.insertTableCell(' - ', i === 0);
    }
    return this;
  }

  insertInlineSeparator(): MdDocumenter {
    this.content += MdDocumenter.INLINE_SEPARATOR;
    return this;
  }

  /**
   * WARNING: Use commonmark newline instead, stripe's markdoc used for
   * rendering the docs doesn't seem to recognize it, but it recognizes
   * commonmark's newline
   */
  insertBreak(apply: boolean | null | undefined = true): MdDocumenter {
    if (apply) this.content += MdDocumenter.HTML_BREAK;
    return this;
  }

  insertCommonMarkNewLine(apply: boolean | null | undefined = true): MdDocumenter {
    if (apply) this.content += MdDocumenter.COMMON_MARK_NEWLINE;
    return this;
  }

  insertNewLine(apply: boolean | null | undefined = true): MdDocumenter {
    if (apply) this.content += MdDocumenter.NEWLINE;
    return this;
  }

  insertLiteralFieldForMd(
    identifier: string | undefined,
    type: string,
    required: boolean | undefined,
    description: string | undefined
  ): MdDocumenter {
    if (identifier) {
      this.insertInlineCode(identifier).insertInlineSeparator();
    }

    this.insertInlineCode(type)
      .insertInlineSeparator()
      .insertInlineCode(required ? 'Required' : 'Not required');

    if (description) {
      this.insertBreak().insertText(description);
    }

    return this;
  }

  insertJsonFieldComments(
    type: string,
    required: boolean | undefined,
    description: string | undefined
  ): MdDocumenter {
    this.insertText('/**')
      .insertNewLine()
      .insertText(' *')
      .insertText(required ? 'Required' : 'Not required')
      .insertNewLine();
    this.insertText(` * Type ${MdDocumenter.INLINE_SEPARATOR} ${type}`).insertNewLine();

    if (description) {
      this.insertText(' *').insertText(description).insertNewLine();
    }

    this.insertText(' */').insertNewLine();
    return this;
  }

  insertJsonField(
    identifier: string | undefined,
    f: MddocTypeFieldBase,
    ignoreComments = false
  ): MdDocumenter {
    const insertId = () => {
      if (identifier) {
        this.insertText(`"${identifier}": `);
      }
    };

    const insertComment = () => {
      if (!ignoreComments) {
        this.insertJsonFieldComments(f.stringType, f.required, f.description);
      }
    };

    if (isLiteralField(f)) {
      insertComment();
      insertId();
      this.insertText(f.stringType);
    } else if (isObjectField(f)) {
      insertComment();
      insertId();
      this.insertText('{').insertNewLine();

      const fieldObject = f as MddocTypeFieldObject;
      let hasPrevField = false;
      for (const k in fieldObject.fields) {
        if (hasPrevField) {
          this.insertText(',').insertNewLine();
        }

        const fieldObjectProps = fieldObject.fields[k as keyof typeof fieldObject.fields];
        this.insertJsonField(k, fieldObjectProps);
      }

      this.insertNewLine().insertText('}');
    } else if (isArrayField(f)) {
      insertId();
      const farr = f as MddocTypeFieldArray;
      this.insertText('[').insertJsonField(undefined, farr.assertGetType()).insertText(']');
    }

    return this;
  }

  /**
   * Renders a markdown table from an object.
   * Expects all objects to have names, it'll fail otherwise.
   */
  insertObjectAsMdTable(
    id: string | undefined,
    f: MddocTypeFieldObject,
    ignoreRequired = false,
    omitName = false,
    renderedObjects: Record<string, boolean> = {}
  ): MdDocumenter {
    // Makes sure objects are not rendered twice
    if (f.name && renderedObjects[f.name]) return this;
    if (f.name) renderedObjects[f.name] = true;

    id = id ?? omitName ? '' : f.name;
    if (id) {
      this.insertInlineCode(id).insertNewLine();
    }

    const putField = (text: string, skipFormatting = false) => {
      this.insertTableCell(skipFormatting ? text : this.wrapInlineCode(text), true);
    };

    const putType = (text: string | string[], skipFormatting = false) => {
      Array.isArray(text)
        ? this.insertTableCell(
            text.map(next => mddoc().insertInlineCode(next).content).join(' or ')
          )
        : this.insertTableCell(skipFormatting ? text : this.wrapInlineCode(text));
    };

    const putRequired = (text?: boolean | string) => {
      !ignoreRequired &&
        this.insertTableCell(isString(text) ? text : text ? 'Required' : 'Not required');
    };

    const putDescription = (text: string | undefined, objects?: MddocTypeFieldObject[]) => {
      const m = mddoc();
      objects?.forEach(next => {
        m.insertText('See below for ')
          .insertInlineCode(next.name)
          .insertText("'s object fields.")
          .insertText(' ');
      });
      m.insertText(text);
      this.insertTableCell(m.content).insertNewLine();
    };

    let innerObjects: MddocTypeFieldObject[] = [];

    putField(' Field ', true);
    putType(' Type ', true);
    putRequired(' Required ');
    putDescription(' Description ');

    putField(' - ', true);
    putType(' - ', true);
    putRequired(' - ');
    putDescription(' - ');

    for (const key in f.fields) {
      const currentField = f.fields[key as keyof typeof f.fields] as MddocTypeFieldBase;
      if (isLiteralField(currentField)) {
        putField(key);
        putType(currentField.stringType);
        putRequired(currentField.required);
        putDescription(currentField.description);
      } else if (isObjectField(currentField)) {
        const objectField = currentField as MddocTypeFieldObject;
        innerObjects.push(objectField);
        putField(key);
        putType(objectField.stringType);
        putRequired(objectField.required);
        putDescription(objectField.description, [objectField]);
      } else if (isArrayField(currentField)) {
        putField(key);

        const arrayField = currentField as MddocTypeFieldArray;
        const arrayFieldType = arrayField.assertGetType();

        const prepareTypes = (iter: MddocTypeFieldBase | null) => {
          const m = mddoc();

          while (!!iter) {
            if (isLiteralField(iter)) {
              m.insertInlineCode(iter.stringType);
              iter = null;
            } else if (isObjectField(iter)) {
              innerObjects.push(iter);
              m.insertInlineCode((iter as MddocTypeFieldObject).stringType);
              iter = null;
            } else if (isArrayField(iter)) {
              const child = (iter as MddocTypeFieldArray).assertGetType();
              m.insertInlineCode('array').insertText(child && ' of ');
              iter = child;
            } else if ((iter as any) instanceof FieldOrCombination) {
              const combinationTypes = (iter as MddocTypeFieldOrCombination)
                .assertGetTypes()
                .map(t => prepareTypes(t))
                .join(' or ');
              m.insertText(`(${combinationTypes})`);
              iter = null;
            }
          }

          return m.content;
        };

        putType(prepareTypes(arrayField), true);
        putRequired(arrayField.required);

        putDescription(
          mddoc()
            .insertText(arrayField.description)
            .insertText(' ')
            .insertText(`${arrayFieldType.description}`).content,
          isObjectField(arrayFieldType) ? [arrayFieldType] : undefined
        );
      } else if ((currentField as any) instanceof FieldOrCombination) {
        const orField = currentField as MddocTypeFieldOrCombination;
        putField(key);
        putType(orField.assertGetTypes().map(t => t.stringType));
        putRequired(orField.required);
        putDescription(
          orField.description,
          orField.assertGetTypes().filter(t => {
            if (isObjectField(t)) {
              innerObjects.push(t);
              return true;
            }
            return false;
          }) as MddocTypeFieldObject[]
        );
      }
    }

    innerObjects = uniqWith(innerObjects, (a, b) => a.getName() === b.getName());
    innerObjects.forEach(next =>
      this.insertNewLine().insertObjectAsMdTable(
        /** id */ undefined,
        next,
        ignoreRequired,
        /** omitName */ false,
        renderedObjects
      )
    );
    return this;
  }
}

export function isLiteralField(
  f: MddocTypeFieldBase
): f is
  | MddocTypeFieldBinary
  | MddocTypeFieldNumber
  | MddocTypeFieldString
  | MddocTypeFieldBoolean
  | MddocTypeFieldUndefined
  | MddocTypeFieldNull {
  return (
    f instanceof FieldBinary ||
    f instanceof FieldNumber ||
    f instanceof FieldString ||
    f instanceof FieldBoolean ||
    f instanceof FieldUndefined ||
    f instanceof FieldNull
  );
}

export function isObjectField(f: any): f is MddocTypeFieldObject {
  return f instanceof FieldObject;
}

export function isArrayField(f: any): f is MddocTypeFieldArray {
  return f instanceof FieldArray;
}

export function isMultipartFormdata(f: any): f is MddocTypeHttpEndpointMultipartFormdata {
  return f instanceof HttpEndpointMultipartFormdata;
}

export function mddoc() {
  return new MdDocumenter();
}

export function httpHeadersToFieldObject(headers: Array<MddocTypeHttpEndpointHeaderItem>) {
  const kf = indexArray(headers, {
    indexer: h => h.assertGetName(),
    reducer: h => h.assertGetType(),
  });
  return new FieldObject().setFields(kf).setName('HTTPHeaders');
}

export function httpPathParameterToFieldObject(
  input: Array<MddocTypeHttpEndpointPathParameterItem>
) {
  const kf = indexArray(input, {
    indexer: h => h.assertGetName(),
    reducer: h => h.assertGetType(),
  });
  return new FieldObject().setFields(kf).setName('HTTPParameterPathname');
}

export function orUndefined(f: MddocTypeFieldBase) {
  return new FieldOrCombination()
    .setRequired(false)
    .setDescription(f.description)
    .setTypes([new FieldUndefined(), f]);
}

export function orNull(f: MddocTypeFieldBase) {
  return new FieldOrCombination()
    .setRequired(f.required)
    .setDescription(f.description)
    .setTypes([new FieldNull(), f]);
}

export function orUndefinedOrNull(f: MddocTypeFieldBase) {
  return orUndefined(orNull(f));
}

export function cloneAndMarkNotRequired<T extends MddocTypeFieldBase>(f: T) {
  return f.clone().setRequired(false);
}

export function asFieldObjectAny<T>(f: FieldObject<T>) {
  return f as FieldObject<any>;
}

export function partialFieldObject<T>(f: FieldObject<T>) {
  const fields = f.getFields();
  let clonedFields: typeof fields | undefined = undefined;

  if (fields) {
    clonedFields = {...fields};
    forEach(clonedFields, next => {
      next.setRequired(false);
    });
  }

  return new FieldObject().setFields(clonedFields);
}

export function docEndpoint(endpoint: MddocTypeHttpEndpoint) {
  const m = mddoc()
    .insertHeaderTag(2)
    .insertInlineCode(endpoint.basePathname)
    .insertInlineSeparator()
    .insertInlineCode(endpoint.method)
    .insertNewLine();

  const prepareRequestHeaders = () => {
    const headers = endpoint.requestHeaders?.items ?? [];

    if (isObjectField(endpoint.requestBody)) {
      headers.push(
        new HttpEndpointHeaderItem()
          .setName('Content-Type')
          .setType(new FieldString().setValid(['application/json']))
          .setRequired(true)
          .setDescription('Request body type')
      );
    } else if (isMultipartFormdata(endpoint.requestBody)) {
      headers.push(
        new HttpEndpointHeaderItem()
          .setName('Content-Type')
          .setType(new FieldString().setValid(['multipart/form-data']))
          .setRequired(true)
          .setDescription('Request body type')
      );
    }

    return uniqWith(headers, (a, b) => a.name === b.name);
  };

  const prepareResponseHeaders = (response: MddocTypeHttpEndpointResponse) => {
    const headers = response.responseHeaders?.items ?? [];

    if (isObjectField(response.responseBody)) {
      headers.push(
        new HttpEndpointHeaderItem()
          .setName('Content-Type')
          .setType(new FieldString().setValid(['application/json']))
          .setRequired(true)
          .setDescription('Response body type')
      );
    } else if (response.responseBody instanceof FieldBinary) {
      headers.push(
        new HttpEndpointHeaderItem()
          .setName('Content-Type')
          .setType(
            new FieldString()
              .setValid(['application/octet-stream'])
              .setDescription(
                'Binary/Blob type if the type is known or application/octet-stream otherwise.'
              )
          )
          .setRequired(true)
          .setDescription('Response body type')
      );
    }

    return uniqWith(headers, (a, b) => a.name === b.name);
  };

  const putHeaders = (
    headers: MddocTypeHttpEndpointHeaderItem[],
    title: string,
    hideRequiredCell?: boolean
  ) => {
    if (headers.length) {
      m.insertBoldText(title)
        .insertNewLine()
        .insertObjectAsMdTable(
          undefined,
          httpHeadersToFieldObject(headers),
          hideRequiredCell,
          /** omitName */ true
        );
    } else {
      m.insertBoldText(title).insertInlineSeparator().insertText('No headers present');
    }

    m.insertNewLine();
  };

  const putQuery = () => {
    if (endpoint.query) {
      m.insertBoldText('Request Queries')
        .insertNewLine()
        .insertObjectAsMdTable(undefined, endpoint.query);
    } else {
      m.insertBoldText('Request Queries').insertInlineSeparator().insertText('No queries present');
    }

    m.insertNewLine().insertNewLine();
  };

  const putParameterPathnames = () => {
    if (endpoint.pathParamaters) {
      m.insertBoldText('Request Parameter Pathnames')
        .insertNewLine()
        .insertObjectAsMdTable(undefined, httpPathParameterToFieldObject(endpoint.pathParamaters));
    } else {
      m.insertBoldText('Request Parameter Pathnames')
        .insertInlineSeparator()
        .insertText('No extra pathnames present');
    }

    m.insertNewLine().insertNewLine();
  };

  const putRequestBodyType = () => {
    const b = endpoint.requestBody;
    if (b instanceof FieldObject) {
      m.insertBoldText('Request Body Type')
        .insertInlineSeparator()
        .insertInlineCode('application/json');
    } else if (b instanceof HttpEndpointMultipartFormdata) {
      m.insertBoldText('Request Body Type')
        .insertInlineSeparator()
        .insertInlineCode('multipart/form-data');
    }

    m.insertNewLine().insertNewLine();
  };

  const putResponseBodyType = (
    response: MddocTypeHttpEndpointResponse,
    title = 'Response Body Type'
  ) => {
    const b = response.responseBody;
    if (b instanceof FieldObject) {
      m.insertBoldText(title).insertInlineSeparator().insertInlineCode('application/json');
    } else if (b instanceof HttpEndpointMultipartFormdata) {
      m.insertBoldText(title)
        .insertInlineSeparator()
        .insertText('Binary/Blob type if the type is known or ')
        .insertInlineCode('application/octet-stream');
    }

    m.insertNewLine().insertNewLine();
  };

  const putBody = (
    b:
      | MddocTypeFieldObject
      | MddocTypeFieldBinary
      | MddocTypeHttpEndpointMultipartFormdata
      | undefined,
    title: string,
    hideRequiredCell?: boolean
  ) => {
    if (b instanceof FieldObject) {
      m.insertObjectAsMdTable(undefined, b, hideRequiredCell);
    } else if (b instanceof HttpEndpointMultipartFormdata) {
      if (b.getIsSingularBlob()) {
        m.insertBoldText(title).insertInlineSeparator().insertInlineCode('binary');
      } else {
        m.insertBoldText(title)
          .insertNewLine()
          .insertObjectAsMdTable(undefined, b.assertGetItems(), hideRequiredCell);
      }
    } else if (b instanceof FieldBinary) {
      m.insertBoldText(title).insertInlineSeparator().insertInlineCode('binary');
    }

    m.insertNewLine();
  };

  const putResponse = (response: MddocTypeHttpEndpointResponse) => {
    putHeaders(
      prepareResponseHeaders(response),
      `${response.getStatusCode()} ${MdDocumenter.INLINE_SEPARATOR} Response Headers`,
      true
    );
    putResponseBodyType(
      response,
      `${response.getStatusCode()} ${MdDocumenter.INLINE_SEPARATOR} Response Body Type`
    );
    putBody(
      response.responseBody,
      `${response.getStatusCode()} ${MdDocumenter.INLINE_SEPARATOR} Response Body`,
      true
    );
  };

  putParameterPathnames();
  putQuery();
  putHeaders(prepareRequestHeaders(), 'Request Headers');
  putRequestBodyType();
  putBody(endpoint.requestBody, 'Request Body');
  endpoint.getResponses()?.map(putResponse);

  return m.content;
}

export function docEndpointList(endpoints: Array<MddocTypeHttpEndpoint>) {
  return endpoints
    .map(endpoint => docEndpoint(endpoint))
    .join(MdDocumenter.NEWLINE + MdDocumenter.NEWLINE);
}

export function docEndpointListToC(endpoints: Array<MddocTypeHttpEndpoint>) {
  return endpoints.map(
    endpoint =>
      mddoc().insertText(endpoint.basePathname).insertInlineSeparator().insertText(endpoint.method)
        .content
  );
}
