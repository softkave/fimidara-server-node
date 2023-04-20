import {isString, uniqWith} from 'lodash';
import {AnyObject} from 'mongoose';
import {
  FieldBinary,
  FieldObject,
  FieldOrCombination,
  FieldString,
  HttpEndpointHeaderItem,
  HttpEndpointMultipartFormdata,
  MddocTypeFieldArray,
  MddocTypeFieldBase,
  MddocTypeFieldBinary,
  MddocTypeFieldObject,
  MddocTypeFieldOrCombination,
  MddocTypeHttpEndpoint,
  MddocTypeHttpEndpointHeaderItem,
  MddocTypeHttpEndpointMultipartFormdata,
  MddocTypeHttpEndpointResponse,
  httpHeadersToFieldObject,
  httpPathParameterToFieldObject,
  isLiteralField,
  isMddocFieldArray,
  isMddocFieldObject,
  isMddocMultipartFormdata,
} from './mddoc';

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
    } else if (isMddocFieldObject(f)) {
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
    } else if (isMddocFieldArray(f)) {
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
      } else if (isMddocFieldObject(currentField)) {
        const objectField = currentField as MddocTypeFieldObject;
        innerObjects.push(objectField);
        putField(key);
        putType(objectField.stringType);
        putRequired(objectField.required);
        putDescription(objectField.description, [objectField]);
      } else if (isMddocFieldArray(currentField)) {
        putField(key);

        const arrayField = currentField as MddocTypeFieldArray;
        const arrayFieldType = arrayField.assertGetType();

        const prepareTypes = (iter: MddocTypeFieldBase | null) => {
          const m = mddoc();

          while (!!iter) {
            if (isLiteralField(iter)) {
              m.insertInlineCode(iter.stringType);
              iter = null;
            } else if (isMddocFieldObject(iter)) {
              innerObjects.push(iter);
              m.insertInlineCode((iter as MddocTypeFieldObject).stringType);
              iter = null;
            } else if (isMddocFieldArray(iter)) {
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
          isMddocFieldObject(arrayFieldType) ? [arrayFieldType] : undefined
        );
      } else if ((currentField as any) instanceof FieldOrCombination) {
        const orField = currentField as MddocTypeFieldOrCombination;
        putField(key);
        putType(orField.assertGetTypes().map(t => t.stringType));
        putRequired(orField.required);
        putDescription(
          orField.description,
          orField.assertGetTypes().filter(t => {
            if (isMddocFieldObject(t)) {
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

export function mddoc() {
  return new MdDocumenter();
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

    if (isMddocFieldObject(endpoint.requestBody)) {
      headers.push(
        HttpEndpointHeaderItem.construct()
          .setName('Content-Type')
          .setType(FieldString.construct().setValid(['application/json']))
          .setRequired(true)
          .setDescription('Request body type')
      );
    } else if (isMddocMultipartFormdata(endpoint.requestBody)) {
      headers.push(
        HttpEndpointHeaderItem.construct()
          .setName('Content-Type')
          .setType(FieldString.construct().setValid(['multipart/form-data']))
          .setRequired(true)
          .setDescription('Request body type')
      );
    }

    return uniqWith(headers, (a, b) => a.name === b.name);
  };

  const prepareResponseHeaders = (response: MddocTypeHttpEndpointResponse) => {
    const headers = response.responseHeaders?.items ?? [];

    if (isMddocFieldObject(response.responseBody)) {
      headers.push(
        HttpEndpointHeaderItem.construct()
          .setName('Content-Type')
          .setType(FieldString.construct().setValid(['application/json']))
          .setRequired(true)
          .setDescription('Response body type')
      );
    } else if (response.responseBody instanceof FieldBinary) {
      headers.push(
        HttpEndpointHeaderItem.construct()
          .setName('Content-Type')
          .setType(
            FieldString.construct()
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
    body:
      | MddocTypeFieldObject<AnyObject>
      | MddocTypeFieldBinary
      | MddocTypeHttpEndpointMultipartFormdata<AnyObject>
      | undefined,
    title: string,
    hideRequiredCell?: boolean
  ) => {
    if (isMddocFieldObject(body)) {
      m.insertObjectAsMdTable(undefined, body, hideRequiredCell);
    } else if (isMddocMultipartFormdata(body)) {
      m.insertBoldText(title)
        .insertNewLine()
        .insertObjectAsMdTable(undefined, body.assertGetItems(), hideRequiredCell);
    } else if (body instanceof FieldBinary) {
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
