import {OptionalKeysOf} from 'type-fest';
import {
  BaseEndpointResult,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
  HttpEndpointStructure,
} from '../endpoints/types';
import {AccessorConstruct, ClassFieldsWithAccessorsMixin} from '../utils/classAccessors';
import {AnyObject} from '../utils/types';

export class FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldBase());
  }

  __id = FieldBase.name;
  constructor(public required?: boolean, public description?: string) {}
}

export class FieldString extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldString());
  }

  __id = FieldString.name;
  constructor(
    required?: boolean,
    description?: string,
    public example?: string,
    public valid?: string[],
    public min?: number,
    public max?: number,
    public enumName?: string
  ) {
    super(required, description);
  }
}
export class FieldNumber extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldNumber());
  }

  __id = FieldNumber.name;
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

export class FieldBoolean extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldBoolean());
  }

  __id = FieldBoolean.name;
  constructor(required?: boolean, description?: string, public example?: boolean) {
    super(required, description);
  }
}

export class FieldNull extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldNull());
  }

  __id = FieldNull.name;
}

export class FieldUndefined extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldUndefined());
  }

  __id = FieldUndefined.name;
}

export class FieldDate extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldDate());
  }

  __id = FieldDate.name;
  constructor(required?: boolean, description?: string, public example?: string) {
    super(required, description);
  }
}

export class FieldArray<T> extends FieldBase {
  static construct<T>() {
    return AccessorConstruct.wrap(new FieldArray<T>());
  }

  __id = FieldArray.name;
  constructor(
    required?: boolean,
    description?: string,
    public type?: ConvertToMddocType<T>,
    public min?: number,
    public max?: number
  ) {
    super(required, description);
  }
}

export class FieldObjectFieldRequired<T> {
  required = true;
  constructor(public data: T) {}
}
export class FieldObjectFieldOptional<T> {
  optional = true;
  constructor(public data: T) {}
}

export type ConvertToMddocType<T> = T extends string
  ? MddocTypeFieldString
  : T extends number
  ? MddocTypeFieldNumber
  : T extends boolean
  ? MddocTypeFieldBoolean
  : T extends Array<infer InferedType>
  ? MddocTypeFieldArray<InferedType>
  : T extends Buffer
  ? MddocTypeFieldBinary
  : T extends AnyObject
  ? MddocTypeFieldObject<T>
  : MddocTypeFieldBase;

export type FieldObjectFields<T extends object> = Required<{
  [K in keyof T]: K extends OptionalKeysOf<T>
    ? FieldObjectFieldOptional<ConvertToMddocType<T[K]>>
    : FieldObjectFieldRequired<ConvertToMddocType<T[K]>>;
}>;

// API type changes in line with definitions
export class FieldObject<T extends object = any> extends FieldBase {
  static construct<TConstructFields extends object = any>(): ClassFieldsWithAccessorsMixin<
    FieldObject<TConstructFields>
  > {
    return AccessorConstruct.wrap(new FieldObject()) as ClassFieldsWithAccessorsMixin<
      FieldObject<TConstructFields>
    >;
  }

  static optionalField<T1 extends MddocTypeFieldBase>(data: T1) {
    data = (data.getRequired() ? data.clone().setRequired(false) : data) as T1;
    return new FieldObjectFieldOptional<T1>(data);
  }

  static requiredField<T1 extends MddocTypeFieldBase>(data: T1) {
    data = (data.getRequired() === false ? data.clone().setRequired(true) : data) as T1;
    return new FieldObjectFieldRequired<T1>(data);
  }

  __id = FieldObject.name;

  constructor(
    required?: boolean,
    description?: string,
    public name?: string | undefined,
    public fields?: FieldObjectFields<T>
  ) {
    super(required, description);
  }
}

export class FieldOrCombination extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldOrCombination());
  }

  __id = FieldOrCombination.name;
  constructor(required?: boolean, description?: string, public types?: Array<MddocTypeFieldBase>) {
    super(required, description);
  }
}

export class FieldBinary extends FieldBase {
  static construct() {
    return AccessorConstruct.wrap(new FieldBinary());
  }

  __id = FieldBinary.name;
  constructor(required?: boolean, description?: string, public min?: number, public max?: number) {
    super(required, description);
  }
}

export enum HttpEndpointMethod {
  Get = 'get',
  Post = 'post',
  Delete = 'delete',
}

export class HttpEndpointMultipartFormdata<T extends object> {
  static construct<Body extends object = AnyObject>() {
    return AccessorConstruct.wrap(new HttpEndpointMultipartFormdata<Body>());
  }

  __id = HttpEndpointMultipartFormdata.name;
  constructor(public items?: MddocTypeFieldObject<T>) {}
}

export type InferHttpEndpointTTypes<T extends HttpEndpointDefinition<any>> =
  T extends HttpEndpointDefinition<infer TTypes> ? TTypes : never;

export class HttpEndpointDefinition<TStructure extends HttpEndpointStructure> {
  static construct<TTypes extends HttpEndpointStructure>() {
    return AccessorConstruct.wrap(new HttpEndpointDefinition<TTypes>());
  }

  __id = HttpEndpointDefinition.name;
  constructor(
    public basePathname?: string,
    public method?: HttpEndpointMethod,
    public pathParamaters?: MddocTypeFieldObject<TStructure['pathParameters']>,
    public query?: MddocTypeFieldObject<TStructure['query']>,
    public requestBody?:
      | MddocTypeFieldObject<TStructure['requestBody']>
      | MddocTypeHttpEndpointMultipartFormdata<TStructure['requestBody']>,
    public requestHeaders?: MddocTypeFieldObject<TStructure['requestHeaders']>,
    public responseHeaders?: MddocTypeFieldObject<TStructure['responseHeaders']>,
    public responseBody?: TStructure['responseBody'] extends FieldBinary
      ? MddocTypeFieldBinary
      : MddocTypeFieldObject<TStructure['responseBody']>,
    public name?: string,
    public description?: string,

    // no need to manually set these fields
    public errorResponseHeaders?: MddocTypeFieldObject<HttpEndpointResponseHeaders_ContentType_ContentLength>,
    public errorResponseBody?: MddocTypeFieldObject<BaseEndpointResult>
  ) {}
}

export type MddocTypeFieldBase = ClassFieldsWithAccessorsMixin<FieldBase>;
export type MddocTypeFieldString = ClassFieldsWithAccessorsMixin<FieldString>;
export type MddocTypeFieldNumber = ClassFieldsWithAccessorsMixin<FieldNumber>;
export type MddocTypeFieldBoolean = ClassFieldsWithAccessorsMixin<FieldBoolean>;
export type MddocTypeFieldNull = ClassFieldsWithAccessorsMixin<FieldNull>;
export type MddocTypeFieldUndefined = ClassFieldsWithAccessorsMixin<FieldUndefined>;
export type MddocTypeFieldDate = ClassFieldsWithAccessorsMixin<FieldDate>;
export type MddocTypeFieldArray<T> = ClassFieldsWithAccessorsMixin<FieldArray<T>>;
export type MddocTypeFieldObject<TObject extends object = any> = ClassFieldsWithAccessorsMixin<
  FieldObject<TObject>
>;
export type MddocTypeFieldOrCombination = ClassFieldsWithAccessorsMixin<FieldOrCombination>;
export type MddocTypeFieldBinary = ClassFieldsWithAccessorsMixin<FieldBinary>;
export type MddocTypeHttpEndpoint<TTypes extends HttpEndpointStructure> =
  ClassFieldsWithAccessorsMixin<HttpEndpointDefinition<TTypes>>;
export type MddocTypeHttpEndpointMultipartFormdata<T extends object> =
  ClassFieldsWithAccessorsMixin<HttpEndpointMultipartFormdata<T>>;

export function objectHasRequiredFields(item: MddocTypeFieldObject) {
  return item.getFields()
    ? Object.values(item.assertGetFields()).findIndex(next => !next.optional) !== -1
    : false;
}

export function isMddocFieldBase(data: any): data is MddocTypeFieldBase {
  return data && (data as FieldBase).__id === 'FieldBase';
}

export function isMddocFieldString(data: any): data is MddocTypeFieldString {
  return data && (data as FieldString).__id === 'FieldString';
}

export function isMddocFieldNumber(data: any): data is MddocTypeFieldNumber {
  return data && (data as FieldNumber).__id === 'FieldNumber';
}

export function isMddocFieldBoolean(data: any): data is MddocTypeFieldBoolean {
  return data && (data as FieldBoolean).__id === 'FieldBoolean';
}

export function isMddocFieldNull(data: any): data is MddocTypeFieldNull {
  return data && (data as FieldNull).__id === 'FieldNull';
}

export function isMddocFieldUndefined(data: any): data is MddocTypeFieldUndefined {
  return data && (data as FieldUndefined).__id === 'FieldUndefined';
}

export function isMddocFieldDate(data: any): data is MddocTypeFieldDate {
  return data && (data as FieldDate).__id === 'FieldDate';
}

export function isMddocFieldArray(data: any): data is MddocTypeFieldArray<any> {
  return data && (data as FieldArray<any>).__id === 'FieldArray';
}

export function isMddocFieldObject(data: any): data is MddocTypeFieldObject {
  return data && (data as FieldObject).__id === 'FieldObject';
}

export function isMddocFieldOrCombination(data: any): data is MddocTypeFieldOrCombination {
  return data && (data as FieldOrCombination).__id === 'FieldOrCombination';
}

export function isMddocFieldBinary(data: any): data is MddocTypeFieldBinary {
  return data && (data as FieldBinary).__id === 'FieldBinary';
}

export function isMddocMultipartFormdata(
  data: any
): data is MddocTypeHttpEndpointMultipartFormdata<any> {
  return (
    data && (data as HttpEndpointMultipartFormdata<any>).__id === 'HttpEndpointMultipartFormdata'
  );
}

export function isMddocEndpoint(data: any): data is MddocTypeHttpEndpoint<any> {
  return data && (data as HttpEndpointDefinition<any>).__id === 'HttpEndpointDefinition';
}
