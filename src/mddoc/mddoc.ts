import {isString, uniqWith} from 'lodash';
import {makeGetAccessor, makeSetAccessor, withClassAccessors} from '../utils/classAccessors';
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
    constructor(required?: boolean, description?: string, public example?: string, public valid?: string[]) {
      super(required, description);
    }
  }
);

export const FieldNumber = withClassAccessors(
  class FieldNumber_ extends FieldBase {
    stringType = 'number';
    constructor(required?: boolean, description?: string, public example?: number) {
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
    constructor(public type?: InstanceType<typeof FieldBase>, required?: boolean, description?: string) {
      super(required, description);
      this.stringType = `array of (${type ? type.stringType : 'unknown'})`;
    }

    setTypes(type?: InstanceType<typeof FieldBase>) {
      this.type = type;
      if (type) this.stringType = `array of (${type.stringType})`;
    }
  }
);

export class FieldObject<T = AnyObject> extends FieldBase {
  stringType = 'object';
  constructor(
    public name?: string | undefined,
    public fields?: Required<{[K in keyof T]: InstanceType<typeof FieldBase>}>,
    required?: boolean,
    description?: string
  ) {
    super(required, description);
    this.stringType = name ?? this.stringType;
  }

  getName = makeGetAccessor(this, 'name');
  setName = makeSetAccessor(this, 'name');
  getFields = makeGetAccessor(this, 'fields');
  setFields = makeSetAccessor(this, 'fields');
  getRequired = makeGetAccessor(this, 'required');
  setRequired = makeSetAccessor(this, 'required');
  getDescription = makeGetAccessor(this, 'description');
  setDescription = makeSetAccessor(this, 'description');
}

export const FieldOrCombination = withClassAccessors(
  class FieldOrCombination_ extends FieldBase {
    constructor(public types?: Array<InstanceType<typeof FieldBase>>, required?: boolean, description?: string) {
      super(required, description);
      this.stringType = (types ?? []).map(f => f.stringType).join(' or ');
    }

    setTypes(types?: Array<InstanceType<typeof FieldBase>>) {
      this.types = types;
      if (types) this.stringType = types.map(f => f.stringType).join(' or ');
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

export const HttpEndpointQueryItem = withClassAccessors(
  class {
    constructor(
      public name: string,
      public type:
        | InstanceType<typeof FieldString>
        | InstanceType<typeof FieldNumber>
        | InstanceType<typeof FieldNumber>
    ) {}
  }
);

export const HttpEndpointQuery = withClassAccessors(
  class {
    constructor(public items: Array<InstanceType<typeof HttpEndpointQueryItem>>) {}
  }
);

export const HttpEndpointMultipartFormdataItem = withClassAccessors(
  class {
    constructor(
      public name: string,
      public type:
        | InstanceType<typeof FieldString>
        | InstanceType<typeof FieldNumber>
        | InstanceType<typeof FieldNumber>
        | InstanceType<typeof FieldBinary>
    ) {}
  }
);

export const HttpEndpointMultipartFormdata = withClassAccessors(
  class {
    constructor(
      public items?: Array<InstanceType<typeof HttpEndpointMultipartFormdataItem>>,
      public isSingularBlob?: boolean
    ) {}
  }
);

export const HttpEndpointHeaderItem = withClassAccessors(
  class {
    constructor(
      public name?: string,
      public type?: InstanceType<typeof FieldString> | InstanceType<typeof FieldNumber>,
      public required?: boolean,
      public description?: string
    ) {}
  }
);

export const HttpEndpointHeaders = withClassAccessors(
  class {
    constructor(public items?: Array<InstanceType<typeof HttpEndpointHeaderItem>>) {}
  }
);

export const HttpEndpointParameterPathnameItem = withClassAccessors(
  class {
    constructor(public name?: string, public type?: InstanceType<typeof FieldString>) {}
  }
);

export const HttpEndpointDefinition = withClassAccessors(
  class {
    constructor(
      public basePathname?: string,
      public method?: HttpEndpointMethod,
      public parameterPathnames?: Array<InstanceType<typeof HttpEndpointParameterPathnameItem>>,
      public query?: InstanceType<typeof HttpEndpointQuery>,
      public requestBody?:
        | InstanceType<typeof FieldObject<AnyObject>>
        | InstanceType<typeof HttpEndpointMultipartFormdata>,
      public requestHeaders?: InstanceType<typeof HttpEndpointHeaders>,
      public responseBody?: InstanceType<typeof FieldObject<AnyObject>> | InstanceType<typeof FieldBinary>,
      public responseHeaders?: InstanceType<typeof HttpEndpointHeaders>
    ) {}
  }
);

export class MdDocumenter {
  static INLINE_SEPARATOR = ' — ';
  static HTML_BREAK = '<br />';
  static NEWLINE = '\n';
  static TAB = '\t';

  content = '';

  insertText(text?: string | null): MdDocumenter {
    if (text) this.content += text;
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

  insertBreak(apply: boolean | null | undefined = true): MdDocumenter {
    if (apply) this.content += MdDocumenter.HTML_BREAK;
    return this;
  }

  insertNewLine(): MdDocumenter {
    this.content += MdDocumenter.NEWLINE;
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

  insertJsonFieldComments(type: string, required: boolean | undefined, description: string | undefined): MdDocumenter {
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
    f: InstanceType<typeof FieldBase>,
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

      const fieldObject = f;
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
      const farr = f as InstanceType<typeof FieldArray>;
      this.insertText('[').insertJsonField(undefined, farr.assertGetType()).insertText(']');
    }

    return this;
  }

  insertObjectAsMdTable(
    id: string | undefined,
    f: InstanceType<typeof FieldObject>,
    ignoreRequired = false
  ): MdDocumenter {
    id = id ?? f.name;
    if (id) {
      this.insertInlineCode(id).insertNewLine();
    }

    const putField = (text: string, skipFormatting = false) => {
      this.insertTableCell(skipFormatting ? text : this.wrapInlineCode(text), true);
    };

    const putType = (text: string | string[], skipFormatting = false) => {
      Array.isArray(text)
        ? this.insertTableCell(text.map(next => mddoc().insertInlineCode(next).content).join(' or '))
        : this.insertTableCell(skipFormatting ? text : this.wrapInlineCode(text));
    };

    const putRequired = (text?: boolean | string) => {
      !ignoreRequired && this.insertTableCell(isString(text) ? text : text ? 'Required' : 'Not required');
    };

    const putDescription = (text: string | undefined, objects?: InstanceType<typeof FieldObject>[]) => {
      const m = mddoc();
      objects?.forEach(next => {
        m.insertText('See below for ').insertInlineCode(next.name).insertText("'s object fields.").insertBreak(!!text);
      });
      m.insertText(text);
      this.insertTableCell(m.content).insertNewLine();
    };

    const innerObjects: InstanceType<typeof FieldObject>[] = [];

    putField(' Field ', true);
    putType(' Type ', true);
    putRequired(' Required ');
    putDescription(' Description ');

    putField(' - ', true);
    putType(' - ', true);
    putRequired(' - ');
    putDescription(' - ');

    for (const key in f.fields) {
      const currentField = f.fields[key as keyof typeof f.fields] as InstanceType<typeof FieldBase>;
      if (isLiteralField(currentField)) {
        putField(key);
        putType(currentField.stringType);
        putRequired(currentField.required);
        putDescription(currentField.description);
      } else if (isObjectField(currentField)) {
        const objectField = currentField;
        innerObjects.push(objectField);
        putField(key);
        putType(objectField.stringType);
        putRequired(objectField.required);
        putDescription(objectField.description, [objectField]);
      } else if (isArrayField(currentField)) {
        putField(key);

        const arrayField = currentField as InstanceType<typeof FieldArray>;
        const arrayFieldType = arrayField.assertGetType();

        const prepareTypes = (iter: InstanceType<typeof FieldBase> | null) => {
          const m = mddoc();

          while (!!iter) {
            if (isLiteralField(iter)) {
              m.insertInlineCode(iter.stringType);
              iter = null;
            } else if (isObjectField(iter)) {
              innerObjects.push(iter);
              m.insertInlineCode((iter as InstanceType<typeof FieldObject>).stringType);
              iter = null;
            } else if (isArrayField(iter)) {
              const child = (iter as InstanceType<typeof FieldArray>).assertGetType();
              m.insertInlineCode('array').insertText(child && ' of ');
              iter = child;
            } else if ((iter as any) instanceof FieldOrCombination) {
              const combinationTypes = (iter as InstanceType<typeof FieldOrCombination>)
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
            .insertBreak(!!arrayFieldType.description)
            .insertBreak(!!arrayField.description)
            .insertText(`${arrayFieldType.description}`).content,
          isObjectField(arrayFieldType) ? [arrayFieldType] : undefined
        );
      } else if ((currentField as any) instanceof FieldOrCombination) {
        const orField = currentField as InstanceType<typeof FieldOrCombination>;
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
          }) as InstanceType<typeof FieldObject>[]
        );
      }
    }

    innerObjects.forEach(next => this.insertNewLine().insertObjectAsMdTable(undefined, next));
    return this;
  }
}

export function isLiteralField(
  f: InstanceType<typeof FieldBase>
): f is
  | InstanceType<typeof FieldBinary>
  | InstanceType<typeof FieldNumber>
  | InstanceType<typeof FieldString>
  | InstanceType<typeof FieldBoolean>
  | InstanceType<typeof FieldUndefined>
  | InstanceType<typeof FieldNull> {
  return (
    f instanceof FieldBinary ||
    f instanceof FieldNumber ||
    f instanceof FieldString ||
    f instanceof FieldBoolean ||
    f instanceof FieldUndefined ||
    f instanceof FieldNull
  );
}

export function isObjectField(f: any): f is InstanceType<typeof FieldObject> {
  return f instanceof FieldObject;
}

export function isArrayField(f: any): f is InstanceType<typeof FieldArray> {
  return f instanceof FieldArray;
}

export function isMultipartFormdata(f: any): f is InstanceType<typeof HttpEndpointMultipartFormdata> {
  return f instanceof HttpEndpointMultipartFormdata;
}

export function mddoc() {
  return new MdDocumenter();
}

export function httpHeadersToFieldObject(headers: Array<InstanceType<typeof HttpEndpointHeaderItem>>) {
  const kf = indexArray(headers, {
    indexer: h => h.assertGetName(),
    reducer: h => h.assertGetType(),
  });
  return new FieldObject(undefined, kf);
}

export function httpFormdataToFieldObject(fm: InstanceType<typeof HttpEndpointMultipartFormdata>) {
  const kf = indexArray(fm.items, {
    indexer: h => h.name,
    reducer: h => h.type,
  });
  return new FieldObject(undefined, kf);
}

export function httpQueryToFieldObject(fm: InstanceType<typeof HttpEndpointQuery>) {
  const kf = indexArray(fm.items, {
    indexer: h => h.name,
    reducer: h => h.type,
  });
  return new FieldObject(undefined, kf);
}

export function httpParameterPathnameToFieldObject(
  input: Array<InstanceType<typeof HttpEndpointParameterPathnameItem>>
) {
  const kf = indexArray(input, {
    indexer: h => h.assertGetName(),
    reducer: h => h.assertGetType(),
  });
  return new FieldObject(undefined, kf);
}

export function orUndefined(f: InstanceType<typeof FieldBase>) {
  return new FieldOrCombination([new FieldUndefined(), f], f.required, f.description);
}

export function docEndpoint(endpoint: InstanceType<typeof HttpEndpointDefinition>) {
  const m = mddoc()
    .insertInlineCode(endpoint.basePathname)
    .insertInlineSeparator()
    .insertInlineCode(endpoint.method)
    .insertBreak()
    .insertNewLine();

  const prepareRequestHeaders = () => {
    const headers = endpoint.requestHeaders?.items ?? [];

    if (isObjectField(endpoint.requestBody)) {
      headers.push(
        new HttpEndpointHeaderItem(
          'Content-Type',
          new FieldString().setValid(['application/json']),
          /** required */ true,
          'Request body type'
        )
      );
    } else if (isMultipartFormdata(endpoint.requestBody)) {
      headers.push(
        new HttpEndpointHeaderItem(
          'Content-Type',
          new FieldString().setValid(['multipart/form-data']),
          /** required */ true,
          'Request body type'
        )
      );
    }

    return uniqWith(headers, (a, b) => a.name === b.name);
  };

  const prepareResponseHeaders = () => {
    const headers = endpoint.responseHeaders?.items ?? [];

    if (isObjectField(endpoint.responseBody)) {
      headers.push(
        new HttpEndpointHeaderItem(
          'Content-Type',
          new FieldString().setValid(['application/json']),
          /** required */ true,
          'Response body type'
        )
      );
    } else if (endpoint.responseBody instanceof FieldBinary) {
      headers.push(
        new HttpEndpointHeaderItem(
          'Content-Type',
          new FieldString(
            false,
            'Binary/Blob type if the type is known or application/octet-stream otherwise.',
            undefined,
            ['application/octet-stream']
          ),
          /** required */ true,
          'Response body type'
        )
      );
    }

    return uniqWith(headers, (a, b) => a.name === b.name);
  };

  const putHeaders = (headers: InstanceType<typeof HttpEndpointHeaderItem>[], title: string) => {
    if (headers.length) {
      m.insertBoldText(title).insertNewLine().insertObjectAsMdTable(undefined, httpHeadersToFieldObject(headers));
    } else {
      m.insertBoldText(title).insertInlineSeparator().insertText('No headers present');
    }

    m.insertNewLine().insertNewLine();
  };

  const putQuery = () => {
    if (endpoint.query) {
      m.insertBoldText('Request Queries')
        .insertNewLine()
        .insertObjectAsMdTable(undefined, httpQueryToFieldObject(endpoint.query));
    } else {
      m.insertBoldText('Request Queries').insertInlineSeparator().insertText('No queries present');
    }

    m.insertNewLine().insertNewLine();
  };

  const putParameterPathnames = () => {
    if (endpoint.parameterPathnames) {
      m.insertBoldText('Request Parameter Pathnames')
        .insertNewLine()
        .insertObjectAsMdTable(undefined, httpParameterPathnameToFieldObject(endpoint.parameterPathnames));
    } else {
      m.insertBoldText('Request Parameter Pathnames').insertInlineSeparator().insertText('No extra pathnames present');
    }

    m.insertNewLine().insertNewLine();
  };

  const putRequestBodyType = () => {
    const b = endpoint.requestBody;
    if (b instanceof FieldObject) {
      m.insertBoldText('Request Body Type').insertInlineSeparator().insertInlineCode('application/json');
    } else if (b instanceof HttpEndpointMultipartFormdata) {
      m.insertBoldText('Request Body Type').insertInlineSeparator().insertInlineCode('multipart/form-data');
    }

    m.insertNewLine().insertNewLine();
  };

  const putResponseBodyType = () => {
    const b = endpoint.responseBody;
    if (b instanceof FieldObject) {
      m.insertBoldText('Response Body Type').insertInlineSeparator().insertInlineCode('application/json');
    } else if (b instanceof HttpEndpointMultipartFormdata) {
      m.insertBoldText('Response Body Type')
        .insertInlineSeparator()
        .insertText('Binary/Blob type if the type is known or ')
        .insertInlineCode('application/octet-stream');
    }

    m.insertNewLine().insertNewLine();
  };

  const putBody = (
    b:
      | InstanceType<typeof FieldObject>
      | InstanceType<typeof FieldBinary>
      | InstanceType<typeof HttpEndpointMultipartFormdata>
      | undefined,
    title: string
  ) => {
    if (b instanceof FieldObject) {
      m.insertObjectAsMdTable(undefined, b);
    } else if (b instanceof HttpEndpointMultipartFormdata) {
      if (b.isSingularBlob) {
        m.insertBoldText(title).insertInlineSeparator().insertInlineCode('binary');
      } else {
        m.insertBoldText(title).insertNewLine().insertObjectAsMdTable(undefined, httpFormdataToFieldObject(b));
      }
    } else if (b instanceof FieldBinary) {
      m.insertBoldText(title).insertInlineSeparator().insertInlineCode('binary');
    }

    m.insertNewLine().insertNewLine();
  };

  putHeaders(prepareRequestHeaders(), 'Request Headers');
  putParameterPathnames();
  putQuery();
  putRequestBodyType();
  putBody(endpoint.requestBody, 'Request Body');
  putHeaders(prepareResponseHeaders(), 'Response Headers');
  putResponseBodyType();
  putBody(endpoint.responseBody, 'Response Body');

  return m.content;
}

export function docEndpointList(endpoints: Array<InstanceType<typeof HttpEndpointDefinition>>) {
  return endpoints.map(endpoint => docEndpoint(endpoint)).join(MdDocumenter.NEWLINE + MdDocumenter.NEWLINE);
}
