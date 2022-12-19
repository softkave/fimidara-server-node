import {isString, uniqWith} from 'lodash';
import {indexArray} from '../utils/indexArray';

export class FieldBase {
  stringType = 'any';
  constructor(public required?: boolean, public description?: string) {}
}

export class FieldString extends FieldBase {
  stringType = 'string';
  constructor(
    public required?: boolean,
    public description?: string,
    public example?: string,
    public valid?: string[]
  ) {
    super(required, description);
  }

  setValid(valid: string[]) {
    this.valid = valid;
    return this;
  }

  clone(required?: boolean, description?: string, example?: string, valid?: string[]) {
    return new FieldString(
      required ?? this.required,
      description ?? this.description,
      example ?? this.example,
      valid ?? this.valid
    );
  }
}

export class FieldNumber extends FieldBase {
  stringType = 'number';
  constructor(public required?: boolean, public description?: string, public example?: number) {
    super(required, description);
  }
}

export class FieldBoolean extends FieldBase {
  stringType = 'boolean';
  constructor(public required?: boolean, public description?: string, public example?: boolean) {
    super(required, description);
  }
}

export class FieldNull extends FieldBase {
  stringType = 'null';
}

export class FieldUndefined extends FieldBase {
  stringType = 'undefined';
}

export class FieldDate extends FieldBase {
  stringType = 'iso date string';
  constructor(public required?: boolean, public description?: string, public example?: string) {
    super(required, description);
  }
}

export class FieldArray extends FieldBase {
  constructor(public type: FieldBase, public required?: boolean, public description?: string) {
    super(required, description);
    this.stringType = `array of (${type.stringType})`;
  }
}

export class FieldObject<T = any> extends FieldBase {
  stringType = 'object';
  constructor(
    public name: string | undefined,
    public fields: Required<{[K in keyof T]: FieldBase}>,
    public required?: boolean,
    public description?: string
  ) {
    super(required, description);
    this.stringType = name ?? this.stringType;
  }
}

// export class FieldAndCombination extends FieldBase {
//   stringType = 'object';
//   constructor(
//     public parts: FieldObject[],
//     public required?: boolean,
//     public description?: string
//   ) {
//     super(required, description);
//   }
// }

export class FieldOrCombination extends FieldBase {
  constructor(public types: Array<FieldBase>, public required?: boolean, public description?: string) {
    super(required, description);
    this.stringType = types.map(f => f.stringType).join(' or ');
  }
}

export class FieldBinary extends FieldBase {
  stringType = 'binary';
}

export enum HttpEndpointMethod {
  Get = 'get',
  Post = 'post',
  Delete = 'delete',
}

export class HttpEndpointQueryItem {
  constructor(public name: string, public type: FieldString | FieldNumber | FieldBoolean) {}
}

export class HttpEndpointQuery {
  constructor(public items: Array<HttpEndpointQueryItem>) {}
}

export class HttpEndpointMultipartFormdataItem {
  constructor(public name: string, public type: FieldString | FieldNumber | FieldBoolean | FieldBinary) {}
}

export class HttpEndpointMultipartFormdata {
  constructor(public items: Array<HttpEndpointMultipartFormdataItem>, public isSingularBlob?: boolean) {}
}

export class HttpEndpointHeaderItem {
  constructor(
    public name: string,
    public type: FieldString | FieldNumber,
    public required?: boolean,
    public description?: string
  ) {}
}

export class HttpEndpointHeaders {
  constructor(public items: Array<HttpEndpointHeaderItem>) {}
}

export class HttpEndpointParameterPathnameItem {
  constructor(public name: string, public type: FieldString) {}
}

export class HttpEndpointDefinition {
  constructor(
    public basePathname: string,
    public method: HttpEndpointMethod,
    public parameterPathnames?: Array<HttpEndpointParameterPathnameItem>,
    public query?: HttpEndpointQuery,
    public requestBody?: FieldObject | HttpEndpointMultipartFormdata,
    public requestHeaders?: HttpEndpointHeaders,
    public responseBody?: FieldObject | FieldBinary,
    public responseHeaders?: HttpEndpointHeaders
  ) {}
}

export class MdDocumenter {
  inlineSeparator = ' — ';
  htmlBreak = '<br />';
  newLine = '\n';
  tab = '\t';
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
    this.content += this.inlineSeparator;
    return this;
  }

  insertBreak(apply: boolean | null | undefined = true): MdDocumenter {
    if (apply) this.content += this.htmlBreak;
    return this;
  }

  insertNewLine(): MdDocumenter {
    this.content += this.newLine;
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
    this.insertText(` * Type ${this.inlineSeparator} ${type}`).insertNewLine();

    if (description) {
      this.insertText(' *').insertText(description).insertNewLine();
    }

    this.insertText(' */').insertNewLine();
    return this;
  }

  insertJsonField(identifier: string | undefined, f: FieldBase, ignoreComments = false): MdDocumenter {
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

      const obf = f as FieldObject;
      let hasPrevField = false;
      for (const k in obf.fields) {
        if (hasPrevField) {
          this.insertText(',').insertNewLine();
        }

        const kf = obf.fields[k];
        this.insertJsonField(k, kf);
      }

      this.insertNewLine().insertText('}');
    } else if (isArrayField(f)) {
      insertId();
      const farr = f as FieldArray;
      this.insertText('[').insertJsonField(undefined, farr.type).insertText(']');
    }

    return this;
  }

  insertObjectAsMdTable(id: string | undefined, f: FieldObject, ignoreRequired = false): MdDocumenter {
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

    const putDescription = (text: string | undefined, objects?: FieldObject[]) => {
      const m = mddoc();
      objects?.forEach(next => {
        m.insertText('See below for ').insertInlineCode(next.name).insertText("'s object fields.").insertBreak(!!text);
      });
      m.insertText(text);
      this.insertTableCell(m.content).insertNewLine();
    };

    const innerObjects: FieldObject[] = [];

    putField(' Field ', true);
    putType(' Type ', true);
    putRequired(' Required ');
    putDescription(' Description ');

    putField(' - ', true);
    putType(' - ', true);
    putRequired(' - ');
    putDescription(' - ');

    for (const key in f.fields) {
      const currentField = f.fields[key];
      if (isLiteralField(currentField)) {
        putField(key);
        putType(currentField.stringType);
        putRequired(currentField.required);
        putDescription(currentField.description);
      } else if (isObjectField(currentField)) {
        const objectField = currentField as FieldObject;
        innerObjects.push(objectField);
        putField(key);
        putType(objectField.stringType);
        putRequired(objectField.required);
        putDescription(objectField.description, [objectField]);
      } else if (isArrayField(currentField)) {
        putField(key);

        const arrayField = currentField as FieldArray;
        const arrayFieldType = arrayField.type;

        const prepareTypes = (iter: FieldBase | null) => {
          const m = mddoc();

          while (!!iter) {
            if (isLiteralField(iter)) {
              m.insertInlineCode(iter.stringType);
              iter = null;
            } else if (isObjectField(iter)) {
              innerObjects.push(iter);
              m.insertInlineCode((iter as FieldObject).stringType);
              iter = null;
            } else if (isArrayField(iter)) {
              const child = (iter as FieldArray).type;
              m.insertInlineCode('array').insertText(child && ' of ');
              iter = child;
            } else if ((iter as any) instanceof FieldOrCombination) {
              const combinationTypes = (iter as FieldOrCombination).types.map(t => prepareTypes(t)).join(' or ');
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
        const orField = currentField as FieldOrCombination;
        putField(key);
        putType(orField.types.map(t => t.stringType));
        putRequired(orField.required);
        putDescription(
          orField.description,
          orField.types.filter(t => {
            if (isObjectField(t)) {
              innerObjects.push(t);
              return true;
            }
            return false;
          }) as FieldObject[]
        );
      }
    }

    innerObjects.forEach(next => this.insertNewLine().insertObjectAsMdTable(undefined, next));
    return this;
  }
}

export function isLiteralField(
  f: FieldBase
): f is FieldBinary | FieldNumber | FieldString | FieldBoolean | FieldUndefined | FieldNull {
  return (
    f instanceof FieldBinary ||
    f instanceof FieldNumber ||
    f instanceof FieldString ||
    f instanceof FieldBoolean ||
    f instanceof FieldUndefined ||
    f instanceof FieldNull
  );
}

export function isObjectField(f: any): f is FieldObject {
  return f instanceof FieldObject;
}

export function isArrayField(f: any): f is FieldArray {
  return f instanceof FieldArray;
}

export function isMultipartFormdata(f: any): f is HttpEndpointMultipartFormdata {
  return f instanceof HttpEndpointMultipartFormdata;
}

export function mddoc() {
  return new MdDocumenter();
}

export function httpHeadersToFieldObject(headers: HttpEndpointHeaderItem[]) {
  const kf = indexArray(headers, {
    indexer: h => h.name,
    reducer: h => h.type,
  });
  return new FieldObject(undefined, kf);
}

export function httpFormdataToFieldObject(fm: HttpEndpointMultipartFormdata) {
  const kf = indexArray(fm.items, {
    indexer: h => h.name,
    reducer: h => h.type,
  });
  return new FieldObject(undefined, kf);
}

export function httpQueryToFieldObject(fm: HttpEndpointQuery) {
  const kf = indexArray(fm.items, {
    indexer: h => h.name,
    reducer: h => h.type,
  });
  return new FieldObject(undefined, kf);
}

export function httpParameterPathnameToFieldObject(input: Array<HttpEndpointParameterPathnameItem>) {
  const kf = indexArray(input, {
    indexer: h => h.name,
    reducer: h => h.type,
  });
  return new FieldObject(undefined, kf);
}

export function docEndpoint(endpoint: HttpEndpointDefinition) {
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

  const putHeaders = (headers: HttpEndpointHeaderItem[], title: string) => {
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

  const putBody = (b: FieldObject | FieldBinary | HttpEndpointMultipartFormdata | undefined, title: string) => {
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

export function orUndefined(f: FieldBase) {
  return new FieldOrCombination([new FieldUndefined(), f], f.required, f.description);
}
