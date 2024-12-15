import {Readable} from 'stream';
// eslint-disable-next-line node/no-unpublished-import
import {
  AnyFn,
  AnyObject,
  IsBoolean,
  IsStringEnum,
  IsUnion,
  Not,
} from 'softkave-js-utils';
import {IsNever, OptionalKeysOf} from 'type-fest';
import {
  BaseEndpointResult,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../endpoints/types.js';
import {
  makeAssertGetAccessor,
  makeClone,
  makeGetAccessor,
  makeSetAccessor,
} from '../utils/classAccessors.js';
import {mergeData} from '../utils/fns.js';

export interface FieldBaseType {
  __id: string;
  description?: string;
  setDescription: (v: string) => FieldBaseType;
  getDescription: () => string | undefined;
  assertGetDescription: () => string;
  clone: () => FieldBaseType;
}
export interface FieldStringType {
  __id: string;
  example?: string;
  valid?: string[];
  min?: number;
  max?: number;
  enumName?: string;
  description?: string;
  setDescription: (v: string) => FieldStringType;
  getDescription: () => string | undefined;
  assertGetDescription: () => string;
  setExample: (v: string) => FieldStringType;
  getExample: () => string | undefined;
  assertGetExample: () => string;
  setValid: (v: string[]) => FieldStringType;
  getValid: () => string[] | undefined;
  assertGetValid: () => string[];
  setMin: (v: number) => FieldStringType;
  getMin: () => number | undefined;
  assertGetMin: () => number;
  setMax: (v: number) => FieldStringType;
  getMax: () => number | undefined;
  assertGetMax: () => number;
  setEnumName: (v: string) => FieldStringType;
  getEnumName: () => string | undefined;
  assertGetEnumName: () => string;
  clone: () => FieldStringType;
}
export interface FieldNumberType {
  __id: string;
  example?: number;
  integer?: boolean;
  min?: number;
  max?: number;
  description?: string;
  setDescription: (v: string) => FieldNumberType;
  getDescription: () => string | undefined;
  assertGetDescription: () => string;
  setExample: (v: number) => FieldNumberType;
  getExample: () => number | undefined;
  assertGetExample: () => number;
  setInteger: (v: boolean) => FieldNumberType;
  getInteger: () => boolean | undefined;
  assertGetInteger: () => boolean;
  setMin: (v: number) => FieldNumberType;
  getMin: () => number | undefined;
  assertGetMin: () => number;
  setMax: (v: number) => FieldNumberType;
  getMax: () => number | undefined;
  assertGetMax: () => number;
  clone: () => FieldNumberType;
}
export interface FieldBooleanType {
  __id: string;
  example?: boolean;
  description?: string;
  setDescription: (v: string) => FieldBooleanType;
  getDescription: () => string | undefined;
  assertGetDescription: () => string;
  setExample: (v: boolean) => FieldBooleanType;
  getExample: () => boolean | undefined;
  assertGetExample: () => boolean;
  clone: () => FieldBooleanType;
}
export interface FieldNullType {
  __id: 'FieldNull';
  description?: string;
  setDescription: (v: string) => FieldNullType;
  getDescription: () => string | undefined;
  assertGetDescription: () => string;
  clone: () => FieldNullType;
}
export interface FieldUndefinedType {
  __id: string;
  description?: string;
  setDescription: (v: string) => FieldUndefinedType;
  getDescription: () => string | undefined;
  assertGetDescription: () => string;
  clone: () => FieldUndefinedType;
}
export interface FieldDateType {
  __id: string;
  example?: string;
  description?: string;
  setDescription: (v: string) => FieldDateType;
  getDescription: () => string | undefined;
  assertGetDescription: () => string;
  setExample: (v: string) => FieldDateType;
  getExample: () => string | undefined;
  assertGetExample: () => string;
  clone: () => FieldDateType;
}
export interface FieldArrayType<T> {
  __id: string;
  type?: ConvertToMddocType<T>;
  min?: number;
  max?: number;
  description?: string;
  setDescription: (v: string) => FieldArrayType<T>;
  getDescription: () => string | undefined;
  assertGetDescription: () => string;
  setType: (v: ConvertToMddocType<T>) => FieldArrayType<T>;
  getType: () => ConvertToMddocType<T> | undefined;
  assertGetType: () => ConvertToMddocType<T>;
  setMin: (v: number) => FieldArrayType<T>;
  getMin: () => number | undefined;
  assertGetMin: () => number;
  setMax: (v: number) => FieldArrayType<T>;
  getMax: () => number | undefined;
  assertGetMax: () => number;
  clone: () => FieldArrayType<T>;
}
export interface FieldObjectFieldType<T, TRequired extends boolean = any> {
  __id: string;
  required: TRequired;
  data: ConvertToMddocType<T>;
  description?: string;
  setDescription: (v: string) => FieldObjectFieldType<T, TRequired>;
  getDescription: () => string | undefined;
  assertGetDescription: () => string;
  setRequired: (v: TRequired) => FieldObjectFieldType<T, TRequired>;
  getRequired: () => TRequired | undefined;
  assertGetRequired: () => TRequired;
  setData: (v: ConvertToMddocType<T>) => FieldObjectFieldType<T, TRequired>;
  getData: () => ConvertToMddocType<T> | undefined;
  assertGetData: () => ConvertToMddocType<T>;
  clone: () => FieldObjectFieldType<T, TRequired>;
}
export type ConvertToMddocType<
  T = any,
  TAllowOrCombination extends boolean = true,
> = IsNever<
  IsUnion<Exclude<T, undefined>> &
    TAllowOrCombination &
    Not<IsStringEnum<Exclude<T, undefined>>> &
    Not<IsBoolean<Exclude<T, undefined>>>
> extends false
  ? FieldOrCombinationType<Array<ConvertToMddocType<T, false>>>
  : T extends string
    ? FieldStringType
    : T extends number
      ? FieldNumberType
      : T extends boolean
        ? FieldBooleanType
        : T extends Array<infer InferedType>
          ? FieldArrayType<InferedType>
          : T extends Buffer
            ? FieldBinaryType
            : T extends Readable
              ? FieldBinaryType
              : T extends null
                ? FieldNullType
                : T extends AnyObject
                  ? FieldObjectType<Exclude<T, undefined>>
                  : FieldBaseType;
export type FieldObjectFieldsMap<T extends object> = Required<{
  [K in keyof T]: K extends OptionalKeysOf<T>
    ? FieldObjectFieldType<Exclude<T[K], undefined>, false>
    : FieldObjectFieldType<Exclude<T[K], undefined>, true>;
}>;
export interface FieldObjectType<T extends object> {
  __id: string;
  name?: string;
  fields?: FieldObjectFieldsMap<T>;
  description?: string;
  setDescription: (v: string) => FieldObjectType<T>;
  getDescription: () => string | undefined;
  assertGetDescription: () => string;
  setName: (v: string) => FieldObjectType<T>;
  getName: () => string | undefined;
  assertGetName: () => string;
  setFields: (v: FieldObjectFieldsMap<T>) => FieldObjectType<T>;
  getFields: () => FieldObjectFieldsMap<T> | undefined;
  assertGetFields: () => FieldObjectFieldsMap<T>;
  clone: () => FieldObjectType<T>;
}
export interface FieldOrCombinationType<
  T extends FieldBaseType[] = FieldBaseType[],
> {
  __id: string;
  types?: T;
  description?: string;
  setDescription: (v: string) => FieldOrCombinationType<T>;
  getDescription: () => string | undefined;
  assertGetDescription: () => string;
  setTypes: (v: T) => FieldOrCombinationType<T>;
  getTypes: () => T | undefined;
  assertGetTypes: () => T;
  clone: () => FieldOrCombinationType<T>;
}
export interface FieldBinaryType {
  __id: string;
  min?: number;
  max?: number;
  description?: string;
  setDescription: (v: string) => FieldBinaryType;
  getDescription: () => string | undefined;
  assertGetDescription: () => string;
  setMin: (v: number) => FieldBinaryType;
  getMin: () => number | undefined;
  assertGetMin: () => number;
  setMax: (v: number) => FieldBinaryType;
  getMax: () => number | undefined;
  assertGetMax: () => number;
  clone: () => FieldBinaryType;
}
export type MappingFn<
  TSdkParams,
  TRequestHeaders,
  TPathParameters,
  TQuery,
  TRequestBody,
> = AnyFn<
  [keyof TSdkParams],
  | ['header', keyof TRequestHeaders]
  | ['path', keyof TPathParameters]
  | ['query', keyof TQuery]
  | ['body', keyof TRequestBody]
  | undefined
>;
export type SdkParamsToRequestArtifactsMapping<
  TSdkParams,
  TRequestHeaders,
  TPathParameters,
  TQuery,
  TRequestBody,
> = AnyFn<
  [keyof TSdkParams],
  Array<
    | ['header', keyof TRequestHeaders]
    | ['path', keyof TPathParameters]
    | ['query', keyof TQuery]
    | ['body', keyof TRequestBody]
  >
>;
export interface SdkParamsBodyType<
  T extends object = any,
  TRequestHeaders extends object = any,
  TPathParameters extends object = any,
  TQuery extends object = any,
  TRequestBody extends object = any,
> {
  __id: string;
  def?: FieldObjectType<T>;
  mappings: MappingFn<
    T,
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody
  >;
  serializeAs?: 'json' | 'formdata';
  setDef: (
    v: FieldObjectType<T>
  ) => SdkParamsBodyType<
    T,
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody
  >;
  getDef: () => FieldObjectType<T> | undefined;
  assertGetDef: () => FieldObjectType<T>;
  setSerializeAs: (
    v?: 'json' | 'formdata'
  ) => SdkParamsBodyType<
    T,
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody
  >;
  getSerializeAs: () => 'json' | 'formdata' | undefined;
  assertGetSerializeAs: () => 'json' | 'formdata';
  clone: () => SdkParamsBodyType<
    T,
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody
  >;
}
export interface HttpEndpointMultipartFormdataType<T extends object> {
  __id: string;
  items?: FieldObjectType<T>;
  description?: string;
  setDescription: (v: string) => HttpEndpointMultipartFormdataType<T>;
  getDescription: () => string | undefined;
  assertGetDescription: () => string;
  setItems: (v: FieldObjectType<T>) => HttpEndpointMultipartFormdataType<T>;
  getItems: () => FieldObjectType<T> | undefined;
  assertGetItems: () => FieldObjectType<T>;
  clone: () => HttpEndpointMultipartFormdataType<T>;
}
export interface HttpEndpointDefinitionType<
  TRequestHeaders extends AnyObject = AnyObject,
  TPathParameters extends AnyObject = AnyObject,
  TQuery extends AnyObject = AnyObject,
  TRequestBody extends AnyObject = AnyObject,
  TResponseHeaders extends AnyObject = AnyObject,
  TResponseBody extends AnyObject = AnyObject,
  TSdkParams extends AnyObject = TRequestBody,
> {
  __id: string;
  basePathname?: string;
  method?: HttpEndpointMethod;
  pathParamaters?: FieldObjectType<TPathParameters>;
  query?: FieldObjectType<TQuery>;
  requestHeaders?: FieldObjectType<TRequestHeaders>;
  requestBody?:
    | FieldObjectType<TRequestBody>
    | HttpEndpointMultipartFormdataType<TRequestBody>;
  responseHeaders?: FieldObjectType<TResponseHeaders>;
  responseBody?: TResponseBody extends FieldBinaryType
    ? FieldBinaryType
    : FieldObjectType<TResponseBody>;
  sdkParamsBody?: SdkParamsBodyType<
    TSdkParams,
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody
  >;
  name?: string;
  description?: string;

  // No need to manually set these fields, they are automatically added when
  // generating api and sdk since our error response header and body is the
  // same for all endpoints
  errorResponseHeaders?: FieldObjectType<HttpEndpointResponseHeaders_ContentType_ContentLength>;
  errorResponseBody?: FieldObjectType<BaseEndpointResult>;
  setBasePathname: (
    v: string
  ) => HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  >;
  getBasePathname: () => string | undefined;
  assertGetBasePathname: () => string;
  setMethod: (
    v: HttpEndpointMethod
  ) => HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  >;
  getMethod: () => HttpEndpointMethod | undefined;
  assertGetMethod: () => HttpEndpointMethod;
  setPathParamaters: (
    v: FieldObjectType<TPathParameters>
  ) => HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  >;
  getPathParamaters: () => FieldObjectType<TPathParameters> | undefined;
  assertGetPathParamaters: () => FieldObjectType<TPathParameters>;
  setQuery: (
    v: FieldObjectType<TQuery>
  ) => HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  >;
  getQuery: () => FieldObjectType<TQuery> | undefined;
  assertGetQuery: () => FieldObjectType<TQuery>;
  setRequestHeaders: (
    v: FieldObjectType<TRequestHeaders>
  ) => HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  >;
  getRequestHeaders: () => FieldObjectType<TRequestHeaders> | undefined;
  assertGetRequestHeaders: () => FieldObjectType<TRequestHeaders>;
  setRequestBody: (
    v:
      | FieldObjectType<TRequestBody>
      | HttpEndpointMultipartFormdataType<TRequestBody>
  ) => HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  >;
  getRequestBody: () =>
    | FieldObjectType<TRequestBody>
    | HttpEndpointMultipartFormdataType<TRequestBody>
    | undefined;
  assertGetRequestBody: () =>
    | FieldObjectType<TRequestBody>
    | HttpEndpointMultipartFormdataType<TRequestBody>;
  setResponseHeaders: (
    v: FieldObjectType<TResponseHeaders>
  ) => HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  >;
  getResponseHeaders: () => FieldObjectType<TResponseHeaders> | undefined;
  assertGetResponseHeaders: () => FieldObjectType<TResponseHeaders>;
  setResponseBody: (
    v: TResponseBody extends FieldBinaryType
      ? FieldBinaryType
      : FieldObjectType<TResponseBody>
  ) => HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  >;
  getResponseBody: () =>
    | (TResponseBody extends FieldBinaryType
        ? FieldBinaryType
        : FieldObjectType<TResponseBody>)
    | undefined;
  assertGetResponseBody: () => TResponseBody extends FieldBinaryType
    ? FieldBinaryType
    : FieldObjectType<TResponseBody>;
  setSdkParamsBody: (
    v: SdkParamsBodyType<
      TSdkParams,
      TRequestHeaders,
      TPathParameters,
      TQuery,
      TRequestBody
    >
  ) => HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  >;
  getSdkParamsBody: () =>
    | SdkParamsBodyType<
        TSdkParams,
        TRequestHeaders,
        TPathParameters,
        TQuery,
        TRequestBody
      >
    | undefined;
  assertGetSdkParamsBody: () => SdkParamsBodyType<
    TSdkParams,
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody
  >;
  setName: (
    v: string
  ) => HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  >;
  getName: () => string | undefined;
  assertGetName: () => string;
  setDescription: (
    v: string
  ) => HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  >;
  getDescription: () => string | undefined;
  assertGetDescription: () => string;
  setErrorResponseHeaders: (
    v: FieldObjectType<HttpEndpointResponseHeaders_ContentType_ContentLength>
  ) => HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  >;
  getErrorResponseHeaders: () =>
    | FieldObjectType<HttpEndpointResponseHeaders_ContentType_ContentLength>
    | undefined;
  assertGetErrorResponseHeaders: () => FieldObjectType<HttpEndpointResponseHeaders_ContentType_ContentLength>;
  setErrorResponseBody: (
    v: FieldObjectType<BaseEndpointResult>
  ) => HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  >;
  getErrorResponseBody: () => FieldObjectType<BaseEndpointResult> | undefined;
  assertGetErrorResponseBody: () => FieldObjectType<BaseEndpointResult>;
  clone: () => HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  >;
}

export type InferFieldObjectType<
  T,
  TDefault = never,
> = T extends FieldObjectType<infer TObjectType> ? TObjectType : TDefault;
export type InferFieldObjectOrMultipartType<T> = T extends FieldObjectType<
  infer TObjectType
>
  ? TObjectType
  : T extends HttpEndpointMultipartFormdataType<infer TMultipartObjectType>
    ? TMultipartObjectType
    : never;
export type InferSdkParamsType<T> = T extends SdkParamsBodyType<
  infer TObjectType
>
  ? TObjectType
  : never;

function constructFieldBase() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ff0: FieldBaseType = {};
  const ff = {
    __id: 'FieldBase',
    setDescription: makeSetAccessor(ff0, 'description'),
    getDescription: makeGetAccessor(ff0, 'description'),
    assertGetDescription: makeAssertGetAccessor(ff0, 'description'),
    clone: makeClone(ff0),
  };
  return mergeData(ff0, ff, {arrayUpdateStrategy: 'replace'});
}

function constructFieldString() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ff0: FieldStringType = {};
  const ff: FieldStringType = {
    __id: 'FieldString',
    setDescription: makeSetAccessor(ff0, 'description'),
    getDescription: makeGetAccessor(ff0, 'description'),
    assertGetDescription: makeAssertGetAccessor(ff0, 'description'),
    setExample: makeSetAccessor(ff0, 'example'),
    getExample: makeGetAccessor(ff0, 'example'),
    assertGetExample: makeAssertGetAccessor(ff0, 'example'),
    setValid: makeSetAccessor(ff0, 'valid'),
    getValid: makeGetAccessor(ff0, 'valid'),
    assertGetValid: makeAssertGetAccessor(ff0, 'valid'),
    setMin: makeSetAccessor(ff0, 'min'),
    getMin: makeGetAccessor(ff0, 'min'),
    assertGetMin: makeAssertGetAccessor(ff0, 'min'),
    setMax: makeSetAccessor(ff0, 'max'),
    getMax: makeGetAccessor(ff0, 'max'),
    assertGetMax: makeAssertGetAccessor(ff0, 'max'),
    setEnumName: makeSetAccessor(ff0, 'enumName'),
    getEnumName: makeGetAccessor(ff0, 'enumName'),
    assertGetEnumName: makeAssertGetAccessor(ff0, 'enumName'),
    clone: makeClone(ff0),
  };
  return mergeData(ff0, ff, {arrayUpdateStrategy: 'replace'});
}

function constructFieldNumber() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ff0: FieldNumberType = {};
  const ff: FieldNumberType = {
    __id: 'FieldNumber',
    setDescription: makeSetAccessor(ff0, 'description'),
    getDescription: makeGetAccessor(ff0, 'description'),
    assertGetDescription: makeAssertGetAccessor(ff0, 'description'),
    setMin: makeSetAccessor(ff0, 'min'),
    getMin: makeGetAccessor(ff0, 'min'),
    assertGetMin: makeAssertGetAccessor(ff0, 'min'),
    setMax: makeSetAccessor(ff0, 'max'),
    getMax: makeGetAccessor(ff0, 'max'),
    assertGetMax: makeAssertGetAccessor(ff0, 'max'),
    setInteger: makeSetAccessor(ff0, 'integer'),
    getInteger: makeGetAccessor(ff0, 'integer'),
    assertGetInteger: makeAssertGetAccessor(ff0, 'integer'),
    setExample: makeSetAccessor(ff0, 'example'),
    getExample: makeGetAccessor(ff0, 'example'),
    assertGetExample: makeAssertGetAccessor(ff0, 'example'),
    clone: makeClone(ff0),
  };
  return mergeData(ff0, ff, {arrayUpdateStrategy: 'replace'});
}

function constructFieldBoolean() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ff0: FieldBooleanType = {};
  const ff: FieldBooleanType = {
    __id: 'FieldBoolean',
    setDescription: makeSetAccessor(ff0, 'description'),
    getDescription: makeGetAccessor(ff0, 'description'),
    assertGetDescription: makeAssertGetAccessor(ff0, 'description'),
    setExample: makeSetAccessor(ff0, 'example'),
    getExample: makeGetAccessor(ff0, 'example'),
    assertGetExample: makeAssertGetAccessor(ff0, 'example'),
    clone: makeClone(ff0),
  };
  return mergeData(ff0, ff, {arrayUpdateStrategy: 'replace'});
}

function constructFieldNull() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ff0: FieldNullType = {};
  const ff: FieldNullType = {
    __id: 'FieldNull',
    setDescription: makeSetAccessor(ff0, 'description'),
    getDescription: makeGetAccessor(ff0, 'description'),
    assertGetDescription: makeAssertGetAccessor(ff0, 'description'),
    clone: makeClone(ff0),
  };
  return mergeData(ff0, ff, {arrayUpdateStrategy: 'replace'});
}

function constructFieldUndefined() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ff0: FieldUndefinedType = {};
  const ff: FieldUndefinedType = {
    __id: 'FieldUndefined',
    setDescription: makeSetAccessor(ff0, 'description'),
    getDescription: makeGetAccessor(ff0, 'description'),
    assertGetDescription: makeAssertGetAccessor(ff0, 'description'),
    clone: makeClone(ff0),
  };
  return mergeData(ff0, ff, {arrayUpdateStrategy: 'replace'});
}

function constructFieldDate() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ff0: FieldDateType = {};
  const ff: FieldDateType = {
    __id: 'FieldDate',
    setDescription: makeSetAccessor(ff0, 'description'),
    getDescription: makeGetAccessor(ff0, 'description'),
    assertGetDescription: makeAssertGetAccessor(ff0, 'description'),
    setExample: makeSetAccessor(ff0, 'example'),
    getExample: makeGetAccessor(ff0, 'example'),
    assertGetExample: makeAssertGetAccessor(ff0, 'example'),
    clone: makeClone(ff0),
  };
  return mergeData(ff0, ff, {arrayUpdateStrategy: 'replace'});
}

function constructFieldArray<T>() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ff0: FieldArrayType<T> = {};
  const ff: FieldArrayType<T> = {
    __id: 'FieldArray',
    setDescription: makeSetAccessor(ff0, 'description'),
    getDescription: makeGetAccessor(ff0, 'description'),
    assertGetDescription: makeAssertGetAccessor(ff0, 'description'),
    setType: makeSetAccessor(ff0, 'type'),
    getType: makeGetAccessor(ff0, 'type'),
    assertGetType: makeAssertGetAccessor(ff0, 'type'),
    setMin: makeSetAccessor(ff0, 'min'),
    getMin: makeGetAccessor(ff0, 'min'),
    assertGetMin: makeAssertGetAccessor(ff0, 'min'),
    setMax: makeSetAccessor(ff0, 'max'),
    getMax: makeGetAccessor(ff0, 'max'),
    assertGetMax: makeAssertGetAccessor(ff0, 'max'),
    clone: makeClone(ff0),
  };
  return mergeData(ff0, ff, {arrayUpdateStrategy: 'replace'});
}

function constructFieldObjectField<T, TRequired extends boolean = false>(
  required: TRequired,
  data: ConvertToMddocType<T>
) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ff0: FieldObjectFieldType<T, TRequired> = {};
  const ff: FieldObjectFieldType<T, TRequired> = {
    data,
    __id: 'FieldObjectField',
    required,
    setDescription: makeSetAccessor(ff0, 'description'),
    getDescription: makeGetAccessor(ff0, 'description'),
    assertGetDescription: makeAssertGetAccessor(ff0, 'description'),
    setRequired: makeSetAccessor(ff0, 'required'),
    getRequired: makeGetAccessor(ff0, 'required'),
    assertGetRequired: makeAssertGetAccessor(ff0, 'required'),
    setData: makeSetAccessor(ff0, 'data'),
    getData: makeGetAccessor(ff0, 'data'),
    assertGetData: makeAssertGetAccessor(ff0, 'data'),
    clone: makeClone(ff0),
  };
  return mergeData(ff0, ff, {arrayUpdateStrategy: 'replace'});
}

function constructFieldObject<T extends object>() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ff0: FieldObjectType<T> = {};
  const ff: FieldObjectType<T> = {
    __id: 'FieldObject',
    setDescription: makeSetAccessor(ff0, 'description'),
    getDescription: makeGetAccessor(ff0, 'description'),
    assertGetDescription: makeAssertGetAccessor(ff0, 'description'),
    setName: makeSetAccessor(ff0, 'name'),
    getName: makeGetAccessor(ff0, 'name'),
    assertGetName: makeAssertGetAccessor(ff0, 'name'),
    setFields: makeSetAccessor(ff0, 'fields'),
    getFields: makeGetAccessor(ff0, 'fields'),
    assertGetFields: makeAssertGetAccessor(ff0, 'fields'),
    clone: makeClone(ff0),
  };
  return mergeData(ff0, ff, {arrayUpdateStrategy: 'replace'});
}

function constructSdkParamsBody<
  T extends object = any,
  TRequestHeaders extends object = any,
  TPathParameters extends object = any,
  TQuery extends object = any,
  TRequestBody extends object = any,
>(
  mappings: MappingFn<T, TRequestHeaders, TPathParameters, TQuery, TRequestBody>
) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ff0: SdkParamsBodyType<
    T,
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody
  > = {};
  const ff: SdkParamsBodyType<
    T,
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody
  > = {
    mappings,
    __id: 'SdkParamsBody',
    // serializeAs: 'json',
    setDef: makeSetAccessor(ff0, 'def'),
    getDef: makeGetAccessor(ff0, 'def'),
    assertGetDef: makeAssertGetAccessor(ff0, 'def'),
    setSerializeAs: makeSetAccessor(ff0, 'serializeAs'),
    getSerializeAs: makeGetAccessor(ff0, 'serializeAs'),
    assertGetSerializeAs: makeAssertGetAccessor(ff0, 'serializeAs'),
    clone: makeClone(ff0),
  };
  return mergeData(ff0, ff, {arrayUpdateStrategy: 'replace'});
}

function constructFieldOrCombination<T>() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ff0: FieldOrCombinationType<Array<ConvertToMddocType<T, false>>> = {};
  const ff: FieldOrCombinationType<Array<ConvertToMddocType<T, false>>> = {
    __id: 'FieldOrCombination',
    setDescription: makeSetAccessor(ff0, 'description'),
    getDescription: makeGetAccessor(ff0, 'description'),
    assertGetDescription: makeAssertGetAccessor(ff0, 'description'),
    setTypes: makeSetAccessor(ff0, 'types'),
    getTypes: makeGetAccessor(ff0, 'types'),
    assertGetTypes: makeAssertGetAccessor(ff0, 'types'),
    clone: makeClone(ff0),
  };
  return mergeData(ff0, ff, {arrayUpdateStrategy: 'replace'});
}

function constructFieldBinary() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ff0: FieldBinaryType = {};
  const ff: FieldBinaryType = {
    __id: 'FieldBinary',
    setDescription: makeSetAccessor(ff0, 'description'),
    getDescription: makeGetAccessor(ff0, 'description'),
    assertGetDescription: makeAssertGetAccessor(ff0, 'description'),
    setMin: makeSetAccessor(ff0, 'min'),
    getMin: makeGetAccessor(ff0, 'min'),
    assertGetMin: makeAssertGetAccessor(ff0, 'min'),
    setMax: makeSetAccessor(ff0, 'max'),
    getMax: makeGetAccessor(ff0, 'max'),
    assertGetMax: makeAssertGetAccessor(ff0, 'max'),
    clone: makeClone(ff0),
  };
  return mergeData(ff0, ff, {arrayUpdateStrategy: 'replace'});
}

export enum HttpEndpointMethod {
  Get = 'get',
  Post = 'post',
  Delete = 'delete',
  Options = 'options',
  Put = 'put',
  Patch = 'patch',
}

function constructHttpEndpointMultipartFormdata<T extends object>() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ff0: HttpEndpointMultipartFormdataType<T> = {};
  const ff: HttpEndpointMultipartFormdataType<T> = {
    __id: 'HttpEndpointMultipartFormdata',
    setDescription: makeSetAccessor(ff0, 'description'),
    getDescription: makeGetAccessor(ff0, 'description'),
    assertGetDescription: makeAssertGetAccessor(ff0, 'description'),
    setItems: makeSetAccessor(ff0, 'items'),
    getItems: makeGetAccessor(ff0, 'items'),
    assertGetItems: makeAssertGetAccessor(ff0, 'items'),
    clone: makeClone(ff0),
  };
  return mergeData(ff0, ff, {arrayUpdateStrategy: 'replace'});
}

// TODO: use constructors for these for better type checking
function constructHttpEndpointDefinition<
  TRequestHeaders extends AnyObject = AnyObject,
  TPathParameters extends AnyObject = AnyObject,
  TQuery extends AnyObject = AnyObject,
  TRequestBody extends AnyObject = AnyObject,
  TResponseHeaders extends AnyObject = AnyObject,
  TResponseBody extends AnyObject = AnyObject,
  TSdkParams extends AnyObject = TRequestBody,
>() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ff0: HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  > = {};
  const ff: HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  > = {
    __id: 'HttpEndpointDefinition',
    setBasePathname: makeSetAccessor(ff0, 'basePathname'),
    getBasePathname: makeGetAccessor(ff0, 'basePathname'),
    assertGetBasePathname: makeAssertGetAccessor(ff0, 'basePathname'),
    setMethod: makeSetAccessor(ff0, 'method'),
    getMethod: makeGetAccessor(ff0, 'method'),
    assertGetMethod: makeAssertGetAccessor(ff0, 'method'),
    setPathParamaters: makeSetAccessor(ff0, 'pathParamaters'),
    getPathParamaters: makeGetAccessor(ff0, 'pathParamaters'),
    assertGetPathParamaters: makeAssertGetAccessor(ff0, 'pathParamaters'),
    setQuery: makeSetAccessor(ff0, 'query'),
    getQuery: makeGetAccessor(ff0, 'query'),
    assertGetQuery: makeAssertGetAccessor(ff0, 'query'),
    setRequestHeaders: makeSetAccessor(ff0, 'requestHeaders'),
    getRequestHeaders: makeGetAccessor(ff0, 'requestHeaders'),
    assertGetRequestHeaders: makeAssertGetAccessor(ff0, 'requestHeaders'),
    setRequestBody: makeSetAccessor(ff0, 'requestBody'),
    getRequestBody: makeGetAccessor(ff0, 'requestBody'),
    assertGetRequestBody: makeAssertGetAccessor(ff0, 'requestBody'),
    setResponseHeaders: makeSetAccessor(ff0, 'responseHeaders'),
    getResponseHeaders: makeGetAccessor(ff0, 'responseHeaders'),
    assertGetResponseHeaders: makeAssertGetAccessor(ff0, 'responseHeaders'),
    setResponseBody: makeSetAccessor(ff0, 'responseBody'),
    getResponseBody: makeGetAccessor(ff0, 'responseBody'),
    assertGetResponseBody: makeAssertGetAccessor(ff0, 'responseBody'),
    setSdkParamsBody: makeSetAccessor(ff0, 'sdkParamsBody'),
    getSdkParamsBody: makeGetAccessor(ff0, 'sdkParamsBody'),
    assertGetSdkParamsBody: makeAssertGetAccessor(ff0, 'sdkParamsBody'),
    setName: makeSetAccessor(ff0, 'name'),
    getName: makeGetAccessor(ff0, 'name'),
    assertGetName: makeAssertGetAccessor(ff0, 'name'),
    setDescription: makeSetAccessor(ff0, 'description'),
    getDescription: makeGetAccessor(ff0, 'description'),
    assertGetDescription: makeAssertGetAccessor(ff0, 'description'),
    setErrorResponseHeaders: makeSetAccessor(ff0, 'errorResponseHeaders'),
    getErrorResponseHeaders: makeGetAccessor(ff0, 'errorResponseHeaders'),
    assertGetErrorResponseHeaders: makeAssertGetAccessor(
      ff0,
      'errorResponseHeaders'
    ),
    setErrorResponseBody: makeSetAccessor(ff0, 'errorResponseBody'),
    getErrorResponseBody: makeGetAccessor(ff0, 'errorResponseBody'),
    assertGetErrorResponseBody: makeAssertGetAccessor(ff0, 'errorResponseBody'),
    clone: makeClone(ff0),
  };
  return mergeData(ff0, ff, {arrayUpdateStrategy: 'replace'});
}

export const mddocConstruct = {
  constructFieldArray,
  constructFieldBase,
  constructFieldBinary,
  constructFieldBoolean,
  constructFieldDate,
  constructFieldNull,
  constructFieldNumber,
  constructFieldObject,
  constructFieldObjectField,
  constructFieldOrCombination,
  constructFieldString,
  constructFieldUndefined,
  constructHttpEndpointDefinition,
  constructHttpEndpointMultipartFormdata,
  constructSdkParamsBody,
};

export function objectHasRequiredFields(
  item: FieldObjectType<any> | FieldObjectType<AnyObject>
) {
  return item.getFields()
    ? Object.values(item.assertGetFields()).findIndex(next => next.required) !==
        -1
    : false;
}

export function isMddocFieldBase(data: any): data is FieldBaseType {
  return data && (data as FieldBaseType).__id === 'FieldBase';
}

export function isMddocFieldString(data: any): data is FieldStringType {
  return data && (data as FieldStringType).__id === 'FieldString';
}

export function isMddocFieldNumber(data: any): data is FieldNumberType {
  return data && (data as FieldNumberType).__id === 'FieldNumber';
}

export function isMddocFieldBoolean(data: any): data is FieldBooleanType {
  return data && (data as FieldBooleanType).__id === 'FieldBoolean';
}

export function isMddocFieldNull(data: any): data is FieldNullType {
  return data && (data as FieldNullType).__id === 'FieldNull';
}

export function isMddocFieldUndefined(data: any): data is FieldUndefinedType {
  return data && (data as FieldUndefinedType).__id === 'FieldUndefined';
}

export function isMddocFieldDate(data: any): data is FieldDateType {
  return data && (data as FieldDateType).__id === 'FieldDate';
}

export function isMddocFieldArray(data: any): data is FieldArrayType<any> {
  return data && (data as FieldArrayType<any>).__id === 'FieldArray';
}

export function isMddocFieldObject(data: any): data is FieldObjectType<any> {
  return data && (data as FieldObjectType<any>).__id === 'FieldObject';
}

export function isMddocFieldOrCombination(
  data: any
): data is FieldOrCombinationType {
  return data && (data as FieldOrCombinationType).__id === 'FieldOrCombination';
}

export function isMddocFieldBinary(data: any): data is FieldBinaryType {
  return data && (data as FieldBinaryType).__id === 'FieldBinary';
}

export function isMddocMultipartFormdata(
  data: any
): data is HttpEndpointMultipartFormdataType<any> {
  return (
    data &&
    (data as HttpEndpointMultipartFormdataType<any>).__id ===
      'HttpEndpointMultipartFormdata'
  );
}

export function isMddocEndpoint(
  data: any
): data is HttpEndpointDefinitionType<any> {
  return (
    data &&
    (data as HttpEndpointDefinitionType<any>).__id === 'HttpEndpointDefinition'
  );
}

export function isMddocSdkParamsBody(data: any): data is SdkParamsBodyType {
  return data && (data as SdkParamsBodyType<any>).__id === 'SdkParamsBody';
}
